import { NextResponse } from "next/server";
import { getCurrentCustomer, updateCustomerProfile } from "@/lib/customer-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const customer = await getCurrentCustomer();
  if (!customer) {
    return NextResponse.json({ ok: false, error: "لطفاً ابتدا وارد شوید" }, { status: 401 });
  }
  return NextResponse.json({ ok: true, customer });
}

export async function PUT(req: Request) {
  const customer = await getCurrentCustomer();
  if (!customer) {
    return NextResponse.json({ ok: false, error: "لطفاً ابتدا وارد شوید" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const updated = await updateCustomerProfile(customer.phone, body);
    return NextResponse.json({ ok: true, customer: updated });
  } catch (err) {
    console.error("profile update error:", err);
    return NextResponse.json({ ok: false, error: "خطا در به‌روزرسانی مشخصات" }, { status: 500 });
  }
}
