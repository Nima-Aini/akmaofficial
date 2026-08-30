import { NextRequest, NextResponse } from "next/server";
import { createOrder, type OrderInput } from "@/lib/store";
import type { OrderItem } from "@/db/schema";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const customerName = String(body.customerName ?? "").trim();
    const customerPhone = String(body.customerPhone ?? "").trim();
    const customerAddress = String(body.customerAddress ?? "").trim();
    const customerProvince = String(body.customerProvince ?? "").trim();
    const customerCity = String(body.customerCity ?? "").trim();
    const postalCode = String(body.postalCode ?? "").trim();
    const notes = String(body.notes ?? "").trim();
    const rawItems = Array.isArray(body.items) ? body.items : [];

    if (!customerName) {
      return NextResponse.json({ error: "لطفاً نام و نام خانوادگی خود را وارد کنید" }, { status: 400 });
    }
    if (!customerPhone || customerPhone.length < 10) {
      return NextResponse.json({ error: "لطفاً شماره تماس معتبر وارد کنید" }, { status: 400 });
    }
    if (!customerAddress) {
      return NextResponse.json({ error: "لطفاً آدرس دقیق جهت ارسال را وارد کنید" }, { status: 400 });
    }
    if (rawItems.length === 0) {
      return NextResponse.json({ error: "سبد خرید شما خالی است" }, { status: 400 });
    }

    const items: OrderItem[] = rawItems.map((item: Record<string, unknown>) => ({
      productId: Number(item.productId) || 0,
      productName: String(item.productName || "محصول آکما"),
      productImage: String(item.productImage || "/images/products/foam-bottle.png"),
      price: Math.max(0, Number(item.price) || 0),
      unitPrice: typeof item.unitPrice === "string" ? item.unitPrice : undefined,
      quantity: Math.max(1, Number(item.quantity) || 1),
    }));

    const totalAmount = items.reduce((sum, it) => sum + it.price * it.quantity, 0);

    const input: OrderInput = {
      customerName,
      customerPhone,
      customerAddress,
      customerProvince,
      customerCity,
      postalCode,
      notes,
      items,
      totalAmount,
    };

    const order = await createOrder(input);

    return NextResponse.json({
      ok: true,
      trackingCode: order.trackingCode,
      order: {
        id: order.id,
        trackingCode: order.trackingCode,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        totalAmount: order.totalAmount,
        status: order.status,
        createdAt: order.createdAt,
      },
    });
  } catch (error) {
    console.error("Order creation failed:", error);
    return NextResponse.json({ error: "خطا در ثبت سفارش. لطفاً مجدداً تلاش کنید." }, { status: 500 });
  }
}
