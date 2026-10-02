import { NextResponse } from "next/server";
import {
  clearCustomerSessionCookie,
  getCurrentCustomer,
  sendCustomerOtp,
  verifyCustomerOtp,
} from "@/lib/customer-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const customer = await getCurrentCustomer();
  if (!customer) {
    return NextResponse.json({ authenticated: false, customer: null });
  }
  return NextResponse.json({ authenticated: true, customer });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, phone, code, name } = body;

    if (action === "send_otp") {
      const res = await sendCustomerOtp(phone);
      if (!res.ok) {
        return NextResponse.json(
          { ok: false, error: res.error, remainingSeconds: res.remainingSeconds },
          { status: 429 },
        );
      }
      return NextResponse.json({
        ok: true,
        message: "کد تأیید با پیامک ارسال شد",
      });
    }

    if (action === "verify_otp") {
      const res = await verifyCustomerOtp(phone, code, name);
      if (!res.ok) {
        return NextResponse.json({ ok: false, error: res.error }, { status: 400 });
      }
      return NextResponse.json({ ok: true, customer: res.customer });
    }

    if (action === "logout") {
      await clearCustomerSessionCookie();
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, error: "عملیات نامعتبر است" }, { status: 400 });
  } catch (err) {
    console.error("customer auth error:", err);
    return NextResponse.json({ ok: false, error: "خطای سرور" }, { status: 500 });
  }
}
