import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getAllOrders } from "@/lib/store";

export async function GET() {
  const isAdmin = await requireAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
  }

  try {
    const orders = await getAllOrders();
    return NextResponse.json({ ok: true, orders });
  } catch (error) {
    console.error("Admin orders list error:", error);
    return NextResponse.json({ error: "خطا در دریافت لیست سفارش‌ها" }, { status: 500 });
  }
}
