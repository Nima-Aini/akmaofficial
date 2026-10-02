import { NextRequest, NextResponse } from "next/server";
import { getOrderByTrackingCode } from "@/lib/store";
import { getCurrentCustomer } from "@/lib/customer-auth";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = (searchParams.get("code") || searchParams.get("q") || "").trim();

  if (!code) {
    return NextResponse.json(
      { error: "لطفاً کد رهگیری سفارش (مانند AKM-123456) یا شماره بارنامه پستی را وارد کنید." },
      { status: 400 },
    );
  }

  // Prevent arbitrary phone searches in public tracking
  if (/^09\d{9}$/.test(code)) {
    return NextResponse.json(
      {
        error:
          "جهت حفظ حریم خصوصی و امنیت اطلاعات آدرس، جستجوی سفارش با شماره موبایل تنها از طریق ورود به حساب کاربری امکان‌پذیر است.",
      },
      { status: 403 },
    );
  }

  const order = await getOrderByTrackingCode(code);
  if (!order) {
    return NextResponse.json(
      { error: "سفارشی با این کد رهگیری یا شماره بارنامه یافت نشد." },
      { status: 404 },
    );
  }

  // Check if caller is authorized owner or admin
  const customer = await getCurrentCustomer();
  const isAdmin = await requireAdmin();
  const isOwner =
    Boolean(customer && (customer.id === order.customerId || customer.phone === order.customerPhone)) ||
    isAdmin;

  // Masked safe customer name
  const nameParts = order.customerName.trim().split(" ");
  const maskedName =
    nameParts.length > 1
      ? `${nameParts[0].charAt(0)}*** ${nameParts[nameParts.length - 1].charAt(0)}***`
      : `${order.customerName.charAt(0)}***`;

  const maskedPhone = order.customerPhone.replace(/(\d{4})\d{4}(\d{3})/, "$1****$2");

  if (isOwner) {
    // Return full details for verified owner/admin
    return NextResponse.json({
      ok: true,
      isOwner: true,
      order: {
        id: order.id,
        trackingCode: order.trackingCode,
        orderType: order.orderType,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        customerProvince: order.customerProvince,
        customerCity: order.customerCity,
        customerAddress: order.customerAddress,
        postalCode: order.postalCode,
        notes: order.notes,
        items: order.items,
        totalAmount: order.totalAmount,
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        shippingCode: order.shippingCode,
        trackingLink: order.trackingLink,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      },
    });
  }

  // Public Safe View (Zero address/postal disclosure)
  return NextResponse.json({
    ok: true,
    isOwner: false,
    order: {
      trackingCode: order.trackingCode,
      orderType: order.orderType,
      customerName: maskedName,
      customerPhone: maskedPhone,
      customerProvince: order.customerProvince,
      customerCity: order.customerCity,
      items: (order.items || []).map((it) => ({
        productName: it.productName,
        quantity: it.quantity,
        mode: it.mode,
      })),
      totalAmount: order.totalAmount,
      status: order.status,
      paymentStatus: order.paymentStatus,
      shippingCode: order.shippingCode,
      trackingLink: order.trackingLink,
      createdAt: order.createdAt,
    },
  });
}
