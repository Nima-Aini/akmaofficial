/**
 * Akma Official - Real SMS Provider & Rate Limiting Integration
 * Supports MelliPayamak (ملی پیامک), Kavenegar, Faraz/IPPanel, SMS.ir, and custom gateways.
 */
import crypto from "node:crypto";

export interface SmsSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export type PatternSendResult = SmsSendResult & { retryable?: boolean; uncertain?: boolean };

const CONSOLE_SHARED_SEND_URL = "https://console.melipayamak.com/api/send/shared/";

function validPatternArgs(bodyId: number, args: string[]): boolean {
  if (!Number.isSafeInteger(bodyId) || bodyId < 1 || !Array.isArray(args) || args.length < 1 || args.length > 3 ||
      args.some(arg => typeof arg !== "string" || !arg.trim() || arg.length > 100 || /[\r\n\x00-\x1f]/.test(arg))) return false;
  const configured = [
    [Number(process.env.MELLIPAYAMAK_BODY_ID || process.env.SMS_BODY_ID || 556149), 1],
    [Number(process.env.MELLIPAYAMAK_BODY_ID_PAYMENT_SUCCESS || 556154), 3],
    [Number(process.env.MELLIPAYAMAK_BODY_ID_ORDER_SHIPPED || 556160), 2],
    [Number(process.env.MELLIPAYAMAK_BODY_ID_PAYMENT_FAILED || 556162), 1],
  ];
  const expected = configured.find(([id]) => id === bodyId)?.[1];
  if (!expected || args.length !== expected) return false;
  if (bodyId === configured[0][0] && !/^\d{5}$/.test(args[0])) return false;
  if (bodyId === configured[1][0] && (!/^\d+$/.test(args[2]) || Number(args[2]) <= 0)) return false;
  return true;
}

/** A receipt confirms provider acceptance, not handset delivery. */
export async function sendMelliPattern(phone: string, bodyId: number, args: string[]): Promise<PatternSendResult> {
  if (!/^09\d{9}$/.test(phone) || !validPatternArgs(bodyId, args)) {
    return { success: false, error: "invalid_sms_parameters", retryable: false };
  }
  if (process.env.AKMA_INTEGRATION_TEST === "1") {
    if (process.env.NODE_ENV === "production" || process.env.AKMA_TEST_TRANSPORT !== "mock") throw new Error("Mock SMS transport unavailable");
    return { success: true, messageId: "mock-pattern-receipt" };
  }
  const apiKey = process.env.MELLIPAYAMAK_CONSOLE_API_KEY?.trim();
  if (!apiKey || !/^[A-Za-z0-9_-]+$/.test(apiKey)) {
    return { success: false, error: "sms_console_key_not_configured", retryable: false };
  }
  let response: Response;
  try {
    response = await fetch(`${CONSOLE_SHARED_SEND_URL}${encodeURIComponent(apiKey)}`, {
      method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ to: phone, bodyId, args }),
      signal: AbortSignal.timeout(10000),
    });
  } catch {
    // A timeout or disconnect can occur after the provider accepted the SMS.
    return { success: false, error: "sms_response_unknown", uncertain: true };
  }
  if (!response.ok) {
    if (response.status === 429) return { success: false, error: "sms_rate_limited", retryable: true };
    if (response.status >= 500) return { success: false, error: "sms_server_response_unknown", uncertain: true };
    return { success: false, error: `sms_http_${response.status}`, retryable: false };
  }
  let data: unknown;
  try {
    data = await response.json();
  } catch {
    return { success: false, error: "sms_invalid_response", uncertain: true };
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return { success: false, error: "sms_invalid_response", uncertain: true };
  }
  const payload = data as Record<string, unknown>;
  const receipt = payload.recId;
  const validReceipt = (typeof receipt === "string" && /^[1-9]\d*$/.test(receipt)) ||
    (typeof receipt === "number" && Number.isSafeInteger(receipt) && receipt > 0);
  const status = payload.status;
  const statusText = typeof status === "string" ? status.trim().toLowerCase() : "";
  const validStatus = status === undefined || status === null || statusText === "" ||
    ["عملیات موفق", "success", "ok"].includes(statusText) || status === 1 || status === 200;
  if (validReceipt && validStatus) return { success: true, messageId: String(receipt) };
  if (!validReceipt && !validStatus) return { success: false, error: "sms_provider_rejected", retryable: false };
  return { success: false, error: "sms_acceptance_unknown", uncertain: true };
}

export async function sendOtpSms(phone: string, otpCode: string): Promise<SmsSendResult> {
  const provider = (process.env.SMS_PROVIDER || "mellipayamak").toLowerCase();

  if (provider === "mellipayamak" || provider === "melli") {
    const result = await sendMelliPattern(phone, Number(process.env.MELLIPAYAMAK_BODY_ID || process.env.SMS_BODY_ID || 556149), [otpCode]);
    return { success: result.success, messageId: result.messageId, error: result.error };
  }
  // Non-Melli OTP providers retain their existing transport and test mock.
  if (process.env.AKMA_INTEGRATION_TEST === "1") {
    if (process.env.NODE_ENV === "production" || process.env.AKMA_TEST_TRANSPORT !== "mock") throw new Error("Mock SMS transport unavailable");
    return { success: true, messageId: `mock-sms-${phone.slice(-4)}` };
  }

  // 2. Kavenegar Provider (Lookup / Pattern OTP)
  const kavenegarKey = process.env.KAVENEGAR_API_KEY || process.env.SMS_API_KEY;
  if (kavenegarKey && (provider === "kavenegar" || provider === "kaveh")) {
    try {
      const template = process.env.KAVENEGAR_TEMPLATE || "akma-verify";
      const lookupUrl = `https://api.kavenegar.com/v1/${kavenegarKey}/verify/lookup.json?receptor=${encodeURIComponent(
        phone,
      )}&token=${encodeURIComponent(otpCode)}&template=${encodeURIComponent(template)}`;

      const res = await fetch(lookupUrl, { method: "POST" });
      const data = await res.json();
      if (data?.return?.status === 200) {
        return { success: true, messageId: String(data.entries?.[0]?.messageid || "") };
      }

      // If lookup fails or template doesn't exist, fallback to standard SMS send
      const sender = process.env.KAVENEGAR_SENDER || process.env.SMS_SENDER || "";
      if (sender) {
        const sendUrl = `https://api.kavenegar.com/v1/${kavenegarKey}/sms/send.json`;
        const sendRes = await fetch(sendUrl, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            receptor: phone,
            sender,
            message: `کد تأیید ورود به فروشگاه آکما: ${otpCode}\nاین کد تا ۲ دقیقه معتبر است.`,
          }),
        });
        const sendData = await sendRes.json();
        if (sendData?.return?.status === 200) {
          return { success: true, messageId: String(sendData.entries?.[0]?.messageid || "") };
        }
      }
      return { success: false, error: data?.return?.message || "خطا در ارسال پیامک با کاوه‌نگار" };
    } catch (err: unknown) {
      console.error("[SMS] Kavenegar send failed:", err instanceof Error ? err.message : String(err));
      return { success: false, error: "خطا در برقراری ارتباط با سامانه پیامکی" };
    }
  }

  // 3. IPPanel / Faraz SMS Provider (Pattern OTP)
  const ippanelKey = process.env.IPPANEL_API_KEY;
  if (ippanelKey || provider === "ippanel" || provider === "faraz") {
    try {
      const patternCode = process.env.IPPANEL_PATTERN_CODE || "akma-verify";
      const sender = process.env.IPPANEL_SENDER || "+983000505";
      const url = "https://ippanel.com/services.jspd";
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          op: "pattern",
          user: process.env.IPPANEL_USERNAME || "",
          pass: process.env.IPPANEL_PASSWORD || ippanelKey || "",
          fromNum: sender,
          toNum: phone,
          patternCode,
          inputData: [{ code: otpCode }],
        }),
      });
      const data = await res.json();
      if (typeof data === "number" && data > 0) {
        return { success: true, messageId: String(data) };
      }
      return { success: false, error: "خطا در سامانه پیامکی فراز" };
    } catch (err: unknown) {
      console.error("[SMS] IPPanel send failed:", err instanceof Error ? err.message : String(err));
      return { success: false, error: "خطا در سامانه پیامکی" };
    }
  }

  // 4. SMS.ir Provider
  const smsirKey = process.env.SMSIR_API_KEY;
  if (smsirKey || provider === "smsir") {
    try {
      const templateId = process.env.SMSIR_TEMPLATE_ID || "100000";
      const url = "https://api.sms.ir/v1/send/verify";
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": smsirKey || "",
        },
        body: JSON.stringify({
          mobile: phone,
          templateId: Number(templateId),
          parameters: [{ name: "CODE", value: otpCode }],
        }),
      });
      const data = await res.json();
      if (data?.status === 1) {
        return { success: true, messageId: String(data.data?.messageId || "") };
      }
      return { success: false, error: data?.message || "خطا در سامانه sms.ir" };
    } catch (err: unknown) {
      console.error("[SMS] SMS.ir send failed:", err instanceof Error ? err.message : String(err));
      return { success: false, error: "خطا در سامانه پیامکی" };
    }
  }

  // Fallback for development / test mode when no SMS credentials are provided
  if (process.env.NODE_ENV !== "production") {
    return { success: true, messageId: "dev-simulated" };
  }

  return {
    success: false,
    error: "سامانه ارسال پیامک تنظیم نشده است. لطفاً با پشتیبانی تماس بگیرید.",
  };
}

export function generateSecureOtp(): string {
  if (process.env.AKMA_INTEGRATION_TEST === "1" && process.env.AKMA_TEST_TRANSPORT === "mock") {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Deterministic integration OTPs are forbidden in production.");
    }
    return process.env.AKMA_TEST_OTP_CODE || "54321";
  }
  // Cryptographically secure 5-digit OTP
  return crypto.randomInt(10000, 100000).toString();
}
