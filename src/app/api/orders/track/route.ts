import { NextRequest, NextResponse } from "next/server";
import { getOrderByTrackingCode } from "@/lib/store";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code") || searchParams.get("q") || "";

  if (!code.trim()) {
    return NextResponse.json({ error: "لطفاً کد رهگیری یا شماره تماس را وارد کنید" }, { status: 400 });
  }

  const order = await getOrderByTrackingCode(code);
  if (!order) {
    return NextResponse.json(
      { error: "سفارشی با این کد رهگیری یا شماره تماس یافت نشد" },
      { status: 404 },
    );
  }

  return NextResponse.json({
    ok: true,
    order: {
      id: order.id,
      trackingCode: order.trackingCode,
      customerName: order.customerName,
      customerPhone: order.customerPhone.replace(/(\d{4})\d{4}(\d{3})/, "$1****$2"),
      customerProvince: order.customerProvince,
      customerCity: order.customerCity,
      customerAddress: order.customerAddress,
      postalCode: order.postalCode,
      notes: order.notes,
      items: order.items,
      totalAmount: order.totalAmount,
      status: order.status,
      shippingCode: order.shippingCode,
      trackingLink: order.trackingLink,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    },
  });
}
