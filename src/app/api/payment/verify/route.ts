import { NextRequest, NextResponse } from "next/server";
import { processOrderPaymentVerification } from "@/lib/payment";
import type { PaymentProvider } from "@/lib/payment";
import { paymentResultUrl } from "@/lib/payment-result-url";
import { verifyIntentPayment } from "@/lib/paid-checkout";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const authority = searchParams.get("Authority") || "";
  const zibalTrackId = searchParams.get("trackId") || "";
  const trackId = authority || zibalTrackId;
  const provider: PaymentProvider = authority ? "zarinpal" : "zibal";
  const success = searchParams.get("success") || "";
  const orderId = searchParams.get("orderId") || "";
  const status = searchParams.get("Status") || searchParams.get("status") || "";

  if (!trackId || !orderId) {
    return NextResponse.redirect(paymentResultUrl("/checkout", { error: "invalid_track_or_order_id" }));
  }

  // Callback status is untrusted; always verify the attempt with its stored provider.
  const callbackCanceled = success === "0" || status === "3" || status.toUpperCase() === "NOK" || (provider === "zarinpal" && status.toUpperCase() !== "OK");

  // Strictly process payment verification with order binding & amount check
  const isIntent = /^INT-[0-9a-f-]{36}$/i.test(orderId);
  const processRes = isIntent
    ? await verifyIntentPayment(orderId.slice(4), trackId, provider)
    : await processOrderPaymentVerification(orderId, trackId, undefined, provider);

  if (processRes.success) {
    const refNumber = processRes.refNumber || `REF-${trackId}`;
    return NextResponse.redirect(paymentResultUrl("/checkout/result", {
      trackingCode: isIntent ? ("trackingCode" in processRes ? processRes.trackingCode : "") : orderId, status: "success", ref: refNumber, trackId,
    }));
  }

  // A callback alone cannot prove cancellation; provider verification determines failure.
  if (callbackCanceled && !processRes.success) {
    return NextResponse.redirect(paymentResultUrl("/checkout/result", { trackingCode: isIntent ? "" : orderId, status: "canceled" }));
  }
  // Verification failed
  const errorMsg = processRes.error || "تأیید تراکنش با خطا مواجه شد.";
  return NextResponse.redirect(paymentResultUrl("/checkout/result", {
    trackingCode: isIntent ? "" : orderId,
    status: "needsReconciliation" in processRes && processRes.needsReconciliation ? "review" : "failed", error: errorMsg,
  }));
}

export async function POST(req: NextRequest) {
  return GET(req);
}
