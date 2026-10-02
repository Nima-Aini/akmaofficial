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
    try {
      if (mellipayamakBodyId) {
        // Pattern service number API (BaseServiceNumber)
        const res = await fetch("https://rest.payamak-panel.com/api/SendSMS/BaseServiceNumber", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: mellipayamakUser,
            password: mellipayamakPass,
            text: [otpCode],
            to: phone,
            bodyId: Number(mellipayamakBodyId),
          }),
        });
        const data = await res.json();
        // MelliPayamak returns numeric messageId > 15 on success
        if (data && (Number(data.Value) > 15 || data.RetStatus === 1)) {
          return { success: true, messageId: String(data.Value || data.StrRetStatus || "") };
        }
        return { success: false, error: data?.StrRetStatus || "خطا در ارسال پیامک خدماتی ملی پیامک" };
      } else {
        // Standard SMS API
        const sender = process.env.MELLIPAYAMAK_SENDER || process.env.SMS_SENDER || "";
        const res = await fetch("https://rest.payamak-panel.com/api/SendSMS/SendSMS", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: mellipayamakUser,
            password: mellipayamakPass,
            from: sender,
            to: phone,
            text: `کد تأیید ورود به فروشگاه آکما: ${otpCode}\nاین کد تا ۲ دقیقه معتبر است.`,
          }),
        });
        const data = await res.json();
        if (data && (Number(data.Value) > 15 || data.RetStatus === 1)) {
          return { success: true, messageId: String(data.Value || "") };
        }
        return { success: false, error: data?.StrRetStatus || "خطا در ارسال پیامک ملی پیامک" };
      }
    } catch (err: unknown) {
      console.error("[SMS] MelliPayamak send failed:", err instanceof Error ? err.message : String(err));
      return { success: false, error: "خطا در برقراری ارتباط با سامانه ملی پیامک" };
    }
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
