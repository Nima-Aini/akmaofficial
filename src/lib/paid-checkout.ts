import crypto from "node:crypto";
import { db } from "@/db";
import { checkoutIntents, orders, paymentAttempts, type OrderItem } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { createPayment, getConfiguredPaymentProvider, verifyPayment, tomansToRials, type PaymentProvider, type PaymentVerifyResult } from "./payment";
import { enqueueOrderSms } from "./sms-outbox";

export type CheckoutSnapshot = {
  orderType: "retail" | "wholesale";
  customerName: string; customerPhone: string; customerAddress: string;
  customerProvince: string; customerCity: string; postalCode: string;
  notes: string; items: OrderItem[];
};

function requireDatabase() {
  if (!db) throw new Error("اتصال به پایگاه داده برای پرداخت الزامی است");
  return db;
}

export async function startPaidCheckout(customerId: number, snapshot: CheckoutSnapshot, totalAmount: number) {
  const database = requireDatabase();
  tomansToRials(totalAmount);
  const id = crypto.randomUUID();
  const now = new Date();
  await database.insert(checkoutIntents).values({
    id, customerId, orderData: snapshot, totalAmount, status: "pending",
    expiresAt: new Date(now.getTime() + 30 * 60_000), createdAt: now, updatedAt: now,
  });
  return requestIntentPayment(id, customerId);
}

export async function requestIntentPayment(id: string, customerId: number) {
  const database = requireDatabase();
  const intent = (await database.select().from(checkoutIntents).where(and(eq(checkoutIntents.id, id), eq(checkoutIntents.customerId, customerId))).limit(1))[0];
  if (!intent || intent.status !== "pending" || intent.expiresAt < new Date()) {
    throw new Error("نشست پرداخت معتبر نیست؛ لطفاً از سبد خرید دوباره اقدام کنید");
  }
  const flagged = (await database.select({ id: paymentAttempts.id }).from(paymentAttempts)
    .where(and(eq(paymentAttempts.checkoutIntentId, id), eq(paymentAttempts.status, "needs_reconciliation"))).limit(1))[0];
  if (flagged) throw new Error("این پرداخت نیازمند بررسی بانکی است؛ لطفاً دوباره پرداخت نکنید");
  const existing = (await database.select().from(paymentAttempts).where(and(eq(paymentAttempts.checkoutIntentId, id), eq(paymentAttempts.status, "pending"))).limit(1))[0];
  if (existing?.paymentLink) return { intentId: id, paymentLink: existing.paymentLink, totalAmount: intent.totalAmount };

  const provider = getConfiguredPaymentProvider();
  const result = await createPayment({
    trackingCode: `INT-${id}`, totalAmount: intent.totalAmount,
    customerPhone: intent.orderData.customerPhone, customerName: intent.orderData.customerName,
    orderType: intent.orderData.orderType,
  }, provider);
  if (!result.success || !result.paymentUrl || !result.trackId) {
    throw new Error(result.error || "خطا در اتصال به درگاه پرداخت؛ لطفاً دوباره تلاش کنید");
  }
  // Do not send the customer to the gateway until its authority is durable.
  const selected = await database.transaction(async (tx: any) => {
    const locked = (await tx.select().from(checkoutIntents).where(eq(checkoutIntents.id, id)).for("update").limit(1))[0];
    if (!locked || locked.status !== "pending" || locked.expiresAt < new Date()) return null;
    const pending = (await tx.select().from(paymentAttempts).where(and(eq(paymentAttempts.checkoutIntentId, id), eq(paymentAttempts.status, "pending"))).limit(1))[0];
    if (pending?.paymentLink) return pending.paymentLink;
    await tx.insert(paymentAttempts).values({
      checkoutIntentId: id, orderId: null, provider: result.provider, trackId: result.trackId,
      amount: intent.totalAmount, amountRials: tomansToRials(intent.totalAmount),
      paymentLink: result.paymentUrl, status: "pending",
    });
    return result.paymentUrl;
  });
  if (!selected) throw new Error("نشست پرداخت منقضی شده است؛ لطفاً دوباره اقدام کنید");
  return { intentId: id, paymentLink: selected, totalAmount: intent.totalAmount };
}

export async function verifyIntentPayment(
  id: string, trackId: string, provider: PaymentProvider,
  verifyOverride?: (trackId: string, amount: number, provider: PaymentProvider) => Promise<PaymentVerifyResult>,
) {
  const database = requireDatabase();
  const attempt = (await database.select().from(paymentAttempts).where(and(eq(paymentAttempts.provider, provider), eq(paymentAttempts.trackId, trackId), eq(paymentAttempts.checkoutIntentId, id))).limit(1))[0];
  if (!attempt) return { success: false, error: "تلاش پرداخت برای این نشست یافت نشد" };
  const intent = (await database.select().from(checkoutIntents).where(eq(checkoutIntents.id, id)).limit(1))[0];
  if (!intent || attempt.amount !== intent.totalAmount || attempt.amountRials !== tomansToRials(intent.totalAmount)) {
    return { success: false, error: "مبلغ یا نشست پرداخت معتبر نیست" };
  }
  if (attempt.status === "paid" && attempt.orderId) {
    const prior = (await database.select().from(orders).where(eq(orders.id, attempt.orderId)).limit(1))[0];
    if (prior?.paymentStatus === "paid") return { success: true, trackingCode: prior.trackingCode, refNumber: prior.paymentRefId };
  }

  const verified = verifyOverride
    ? await verifyOverride(trackId, intent.totalAmount, provider)
    : await verifyPayment(provider, trackId, intent.totalAmount);
  if (!verified.success) {
    if (verified.confirmedFailure) {
      await database.update(paymentAttempts).set({ status: "failed", rawGatewayResponse: { resultCode: verified.resultCode }, updatedAt: new Date() })
        .where(and(eq(paymentAttempts.id, attempt.id), eq(paymentAttempts.status, "pending")));
    }
    return { success: false, error: verified.error || "پرداخت تأیید نشد" };
  }
  if (!Number.isSafeInteger(verified.rawAmountRials) || verified.rawAmountRials !== tomansToRials(intent.totalAmount) || !verified.refNumber) {
    await database.update(paymentAttempts).set({ status: "needs_reconciliation", rawGatewayResponse: { reason: "amount_or_reference_mismatch" }, updatedAt: new Date() }).where(eq(paymentAttempts.id, attempt.id));
    return { success: false, needsReconciliation: true, error: "مبلغ یا کد مرجع پرداخت با نشست مطابقت ندارد؛ بررسی بانکی لازم است" };
  }

  try {
    return await database.transaction(async (tx: any) => {
      // Lock the parent first: concurrent callbacks for different attempts serialize here.
      const fresh = (await tx.select().from(checkoutIntents).where(eq(checkoutIntents.id, id)).for("update").limit(1))[0];
      const payment = (await tx.select().from(paymentAttempts).where(eq(paymentAttempts.id, attempt.id)).for("update").limit(1))[0];
      if (!fresh || !payment || payment.checkoutIntentId !== id || payment.amountRials !== verified.rawAmountRials) {
        return { success: false, error: "نشست یا تلاش پرداخت تغییر کرده است" };
      }
      if (fresh.status === "paid" && fresh.orderId) {
        const previous = (await tx.select().from(orders).where(eq(orders.id, fresh.orderId)).limit(1))[0];
        if (payment.status !== "paid") {
          await tx.update(paymentAttempts).set({ status: "duplicate_paid", verifiedRef: verified.refNumber, updatedAt: new Date() }).where(eq(paymentAttempts.id, payment.id));
          return { success: false, needsReconciliation: true, error: "پرداخت دوم برای این خرید ثبت شده و نیازمند بررسی و استرداد است" };
        }
        return { success: true, trackingCode: previous.trackingCode, refNumber: previous.paymentRefId };
      }
      const other = (await tx.select({ id: paymentAttempts.id }).from(paymentAttempts).where(and(eq(paymentAttempts.provider, provider), eq(paymentAttempts.verifiedRef, verified.refNumber!), eq(paymentAttempts.status, "paid"))).limit(1))[0];
      if (other) return { success: false, error: "کد مرجع قبلاً برای پرداخت دیگری استفاده شده است" };
      const data = fresh.orderData as CheckoutSnapshot;
      const now = verified.paidAt || new Date();
      const trackingCode = `AKM-${crypto.randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`;
      const order = (await tx.insert(orders).values({
        ...data, customerId: fresh.customerId, trackingCode, totalAmount: fresh.totalAmount,
        status: "pending", paymentStatus: "paid", paymentMethod: "online",
        paymentLink: payment.paymentLink, paymentRefId: verified.refNumber,
        paymentTrackId: trackId, paidAt: now, createdAt: now, updatedAt: now,
      }).returning())[0];
      await tx.update(paymentAttempts).set({ status: "paid", orderId: order.id, verifiedRef: verified.refNumber, rawGatewayResponse: { resultCode: verified.resultCode, rawAmountRials: verified.rawAmountRials }, updatedAt: now }).where(eq(paymentAttempts.id, payment.id));
      await tx.update(checkoutIntents).set({ status: "paid", orderId: order.id, updatedAt: now }).where(eq(checkoutIntents.id, id));
      await enqueueOrderSms(tx, "payment_success", order, `payment-success:${order.id}`, payment.id);
      return { success: true, trackingCode, refNumber: verified.refNumber };
    });
  } catch (error) {
    // The attempt stays recoverable; a verified payment is never silently discarded.
    console.error("Paid checkout finalization requires reconciliation:", error);
    await database.update(paymentAttempts).set({ status: "needs_reconciliation", rawGatewayResponse: { reason: "finalization_failed" }, updatedAt: new Date() })
      .where(and(eq(paymentAttempts.id, attempt.id), eq(paymentAttempts.status, "pending"))).catch(() => {});
    return { success: false, needsReconciliation: true, error: "پرداخت تأیید شد اما ثبت نهایی نیازمند بررسی است؛ دوباره پرداخت نکنید" };
  }
}
