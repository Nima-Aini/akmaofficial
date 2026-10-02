import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { getOrderByTrackingCode, updateOrder } from "@/lib/store";
import { createZibalPayment, atomicUpdateOrderPaymentRetry, recordPaymentAttempt } from "@/lib/payment";
import { getCurrentCustomer } from "@/lib/customer-auth";
import { getAdminUsername } from "@/lib/auth";
import { normalizePhone } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { trackingCode } = await req.json();
    if (!trackingCode || typeof trackingCode !== "string") {
      return NextResponse.json({ ok: false, error: "کد پیگیری سفارش الزامی است." }, { status: 400 });
    }

    // 1. Require valid Customer or DB-backed Admin Session (Reject anonymous requests)
    const customer = await getCurrentCustomer();
    const adminUsername = await getAdminUsername();

    if (!customer && !adminUsername) {
      return NextResponse.json(
        { ok: false, error: "لطفاً برای پرداخت مجدد سفارش ابتدا وارد حساب کاربری خود شوید." },
        { status: 401 },
      );
    }

    // 2. Fetch Order by Tracking Code
    const order = await getOrderByTrackingCode(trackingCode);
    if (!order) {
      return NextResponse.json({ ok: false, error: "سفارشی با این کد پیگیری یافت نشد." }, { status: 404 });
    }

    // 3. Verify Ownership using customerId authority & historical order reconciliation
    if (!adminUsername) {
      let isOwner = false;

      if (customer) {
        if (order.customerId && customer.id) {
          // Primary check using authenticated customerId
          isOwner = order.customerId === customer.id;
        } else if (!order.customerId) {
          // Secure Historical Order Ownership Reconciliation Process:
          // Match normalized customer phone numbers to link historical unassigned orders to customerId
          const sessionPhone = normalizePhone(customer.phone || "");
          const orderPhone = normalizePhone(order.customerPhone || "");

          if (sessionPhone && orderPhone && sessionPhone === orderPhone) {
            isOwner = true;
            // Securely reconcile/link customerId to historical order
            await updateOrder(order.id, { customerId: customer.id });
          }
        }
      }

      if (!isOwner) {
        return NextResponse.json(
          { ok: false, error: "شما مجاز به تغییر یا پرداخت مجدد این سفارش نیستید." },
          { status: 403 },
        );
      }
    }

    // 4. Prevent retry if order is already paid
    if (order.paymentStatus === "paid") {
      return NextResponse.json(
        { ok: false, error: "این سفارش قبلاً پرداخت و تسویه شده است." },
        { status: 400 },
      );
    }

    // 5. Generate new Zibal Gateway payment link
    const payRes = await createZibalPayment({
      trackingCode: order.trackingCode,
      totalAmount: order.totalAmount,
      customerPhone: order.customerPhone,
      customerName: order.customerName,
      orderType: order.orderType as "retail" | "wholesale",
    });

    if (!payRes.success || !payRes.paymentUrl) {
      const errorMsg = payRes.error || "خطا در اتصال مجدد به درگاه پرداخت";
      await recordPaymentAttempt({
        orderId: order.id,
        provider: "zibal",
        trackId: `retry-request-failed-${order.id}-${crypto.randomUUID()}`,
        amountTomans: order.totalAmount,
        status: "failed",
        rawGatewayResponse: { error: errorMsg.slice(0, 1000) },
      });
      return NextResponse.json({ ok: false, error: errorMsg }, { status: 502 });
    }

    // 6. Conditionally & Atomically update order payment status in DB (where paymentStatus != 'paid')
    const paymentTrackId = payRes.trackId || "";
    const paymentLink = payRes.paymentUrl;

    const updated = await atomicUpdateOrderPaymentRetry(order.id, paymentTrackId, paymentLink);

    if (!updated) {
      return NextResponse.json(
        { ok: false, error: "سفارش در حین پردازش تسویه گردید یا یافت نشد." },
        { status: 409 },
      );
    }

    return NextResponse.json({
      ok: true,
      paymentLink,
      paymentTrackId,
    });
  } catch (err: unknown) {
    console.error("Retry payment error:", err);
    return NextResponse.json({ ok: false, error: "خطای سرور در تلاش مجدد برای پرداخت" }, { status: 500 });
  }
}
