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

/** Provider accepted means RetStatus=1 and an actual positive receipt ID. */
export async function sendMelliPattern(phone: string, bodyId: number, parameters: string[]): Promise<PatternSendResult> {
  if (process.env.AKMA_INTEGRATION_TEST === "1") {
    if (process.env.NODE_ENV === "production" || process.env.AKMA_TEST_TRANSPORT !== "mock") throw new Error("Mock SMS transport unavailable");
    return { success: true, messageId: "mock-pattern-receipt" };
  }
  const username = process.env.MELLIPAYAMAK_USERNAME || process.env.SMS_USERNAME || "";
  const password = process.env.MELLIPAYAMAK_PASSWORD || process.env.SMS_PASSWORD || "";
  if (!username || !password || !Number.isSafeInteger(bodyId) || bodyId < 1 || !/^09\d{9}$/.test(phone) || !parameters.length || parameters.some(p => !p || p.includes(";"))) {
    return { success: false, error: "invalid_sms_configuration_or_parameters", retryable: false };
  }
  try {
    const res = await fetch("https://rest.payamak-panel.com/api/SendSMS/BaseServiceNumber", {
      method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ username, password, text: parameters.join(";"), to: phone, bodyId: String(bodyId) }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return { success: false, error: `http_${res.status}`, retryable: res.status >= 500 };
    const data = await res.json();
    if (Number(data?.RetStatus) === 1 && /^\d+$/.test(String(data?.Value)) && Number(data.Value) > 15) {
      return { success: true, messageId: String(data.Value) };
    }
    return { success: false, error: `provider_${Number(data?.RetStatus) || "invalid_response"}`, retryable: false };
  } catch {
    // Request may have been accepted before the connection failed: quarantine for review.
    return { success: false, error: "provider_response_unknown", uncertain: true };
  }
}

export async function sendOtpSms(phone: string, otpCode: string): Promise<SmsSendResult> {
  if (process.env.AKMA_INTEGRATION_TEST === "1") {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Integration mock SMS transport is forbidden in production.");
    }
    if (process.env.AKMA_TEST_TRANSPORT !== "mock") {
      throw new Error("Integration tests require AKMA_TEST_TRANSPORT=mock; real SMS transport is disabled.");
    }
    return { success: true, messageId: `mock-sms-${phone.slice(-4)}` };
  }
  const provider = (process.env.SMS_PROVIDER || "mellipayamak").toLowerCase();

  // 1. MelliPayamak Provider (ملی پیامک)
  const mellipayamakUser = process.env.MELLIPAYAMAK_USERNAME || process.env.SMS_USERNAME || "";
  const mellipayamakPass = process.env.MELLIPAYAMAK_PASSWORD || process.env.SMS_PASSWORD || "";
  const mellipayamakBodyId = process.env.MELLIPAYAMAK_BODY_ID || process.env.SMS_BODY_ID || "";

  if (mellipayamakUser && mellipayamakPass && (provider === "mellipayamak" || provider === "melli" || mellipayamakBodyId)) {
    if (mellipayamakBodyId) {
      const result = await sendMelliPattern(phone, Number(mellipayamakBodyId), [otpCode]);
      return { success: result.success, messageId: result.messageId, error: result.error };
    }
    return { success: false, error: "MELLIPAYAMAK_BODY_ID is required" };
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
