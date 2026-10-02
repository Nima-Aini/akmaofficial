/**
 * Akma Official - Production Payment Gateway Integration (Zibal)
 * Supports real online payment requests, relational payment attempts tracking,
 * verified callbacks, concurrency-safe retries, duplicate charge escalation, and fail-closed settlement.
 */

import crypto from "node:crypto";
import { assertMemoryStoreAllowed, db } from "@/db";
import { orders, paymentAttempts, type OrderRow, type PaymentAttemptRow } from "@/db/schema";
import { and, eq, ne } from "drizzle-orm";
import { getMemoryStore, getMemoryPaymentAttempts, getOrderByTrackingCode } from "./store";

function integrationMockEnabled(): boolean {
  if (process.env.AKMA_INTEGRATION_TEST !== "1") return false;
  if (process.env.NODE_ENV === "production") {
    throw new Error("Integration mock payment transport is forbidden in production.");
  }
  return true;
}

export interface PaymentRequestResult {
  success: boolean;
  trackId?: string;
  paymentUrl?: string;
  error?: string;
}

export interface PaymentVerifyResult {
  success: boolean;
  resultCode: number;
  refNumber?: string;
  rawAmountRials?: number;
  amountTomans?: number;
  cardNumber?: string;
  paidAt?: Date;
  alreadyVerified?: boolean;
  error?: string;
}

export interface OrderPaymentProcessResult {
  success: boolean;
  alreadyPaid?: boolean;
  duplicatePaid?: boolean;
  refNumber?: string;
  amount?: number;
  paidAt?: Date;
  warning?: string;
  error?: string;
}

function safeGatewayMetadata(result: PaymentVerifyResult | { error?: string }): Record<string, unknown> {
  const verifyResult = result as PaymentVerifyResult;
  return {
    success: Boolean(verifyResult.success),
    ...(Number.isFinite(verifyResult.resultCode) ? { resultCode: verifyResult.resultCode } : {}),
    ...(verifyResult.refNumber ? { refNumber: verifyResult.refNumber } : {}),
    ...(typeof verifyResult.rawAmountRials === "number" ? { rawAmountRials: verifyResult.rawAmountRials } : {}),
    ...(verifyResult.alreadyVerified !== undefined ? { alreadyVerified: verifyResult.alreadyVerified } : {}),
    ...(verifyResult.paidAt ? { paidAt: verifyResult.paidAt.toISOString() } : {}),
    ...(result.error ? { error: result.error.slice(0, 1000) } : {}),
  };
}

function getZibalMerchant(): string {
  const merchant = process.env.ZIBAL_MERCHANT || process.env.ZIBAL_MERCHANT_ID || "";
  if (process.env.NODE_ENV === "production") {
    if (!merchant || merchant === "zibal") {
      throw new Error(
        "خطای امنیتی پیکربندی: کد مرچنت زیبال (ZIBAL_MERCHANT) در محیط پروداکشن تنظیم نشده است. استفاده از حالت آزمایشی (zibal) در محیط پروداکشن غیرمجاز است.",
      );
    }
  }
  return merchant || "zibal";
}

function getBaseUrl(): string {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/+$/, "");
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "https://akmaofficial.ir";
}

/**
 * Creates a real online payment request with Zibal gateway.
 * Converts Iranian Tomans to Rials (x10).
 */
export async function createZibalPayment(order: {
  id?: number;
  trackingCode: string;
  totalAmount: number;
  customerPhone?: string;
  customerName?: string;
  orderType?: string;
}): Promise<PaymentRequestResult> {
  if (integrationMockEnabled()) {
    if (process.env.AKMA_TEST_TRANSPORT !== "mock") {
      throw new Error("Integration tests require AKMA_TEST_TRANSPORT=mock; real payment transport is disabled.");
    }
    const trackId = `mock-${order.id ?? order.trackingCode}-${crypto.randomUUID()}`;
    return { success: true, trackId, paymentUrl: `https://payments.invalid/start/${encodeURIComponent(trackId)}` };
  }
  const merchant = getZibalMerchant();
  const amountRials = Math.round(Number(order.totalAmount) * 10);
  const baseUrl = getBaseUrl();

  const callbackUrl = `${baseUrl}/api/payment/verify?orderId=${encodeURIComponent(order.trackingCode)}`;

  const description = `سفارش شماره ${order.trackingCode} (${
    order.orderType === "wholesale" ? "خرید عمده" : "خرید تکی"
  }) در فروشگاه آکما`;

  try {
    const res = await fetch("https://gateway.zibal.ir/v1/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        merchant,
        amount: amountRials,
        callbackUrl,
        description,
        orderId: order.trackingCode,
        mobile: order.customerPhone || undefined,
      }),
    });

    const data = await res.json();

    if (data && data.result === 100 && data.trackId) {
      const trackId = String(data.trackId);
      const isSandbox = merchant === "zibal";
      const paymentUrl = isSandbox
        ? `https://gateway.zibal.ir/start/${trackId}?sandBox=true`
        : `https://gateway.zibal.ir/start/${trackId}`;

      return {
        success: true,
        trackId,
        paymentUrl,
      };
    }

    const message = data?.message || `خطای درگاه زیبال (کد: ${data?.result})`;
    console.error("[PAYMENT] Zibal request returned error:", data);
    return {
      success: false,
      error: message,
    };
  } catch (err: unknown) {
    console.error("[PAYMENT] Failed to reach Zibal API:", err);
    return {
      success: false,
      error: "خطا در اتصال به درگاه پرداخت اینترنتی",
    };
  }
}

/**
 * Verifies a transaction with Zibal using trackId.
 * Result 100 = Transaction successful.
 * Result 201 = Already verified (idempotent success).
 */
export async function verifyZibalPayment(trackId: string): Promise<PaymentVerifyResult> {
  if (integrationMockEnabled()) {
    if (process.env.AKMA_TEST_TRANSPORT !== "mock") {
      throw new Error("Integration tests require AKMA_TEST_TRANSPORT=mock; real payment transport is disabled.");
    }
    return { success: false, resultCode: -2, error: `Mock verification requires an explicit test override (${trackId}).` };
  }
  const merchant = getZibalMerchant();

  try {
    const res = await fetch("https://gateway.zibal.ir/v1/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        merchant,
        trackId: Number(trackId) || trackId,
      }),
    });

    const data = await res.json();
    const resultCode = Number(data?.result);

    if (resultCode === 100 || resultCode === 201) {
      const rawAmount = data?.amount;
      const numRials = typeof rawAmount === "number" ? rawAmount : Number(rawAmount);
      const validAmountRials = !isNaN(numRials) && numRials > 0 ? numRials : undefined;

      return {
        success: true,
        resultCode,
        refNumber: data.refNumber ? String(data.refNumber) : `REF-${trackId}`,
        rawAmountRials: validAmountRials,
        amountTomans: validAmountRials !== undefined ? Math.round(validAmountRials / 10) : undefined,
        cardNumber: data.cardNumber || undefined,
        paidAt: data.paidAt ? new Date(data.paidAt) : new Date(),
        alreadyVerified: resultCode === 201,
      };
    }

    return {
      success: false,
      resultCode,
      error: data?.message || `تراکنش ناموفق بود یا لغو گردید (کد: ${resultCode})`,
    };
  } catch (err: unknown) {
    console.error("[PAYMENT] Zibal verification failed:", err);
    return {
      success: false,
      resultCode: -1,
      error: "خطا در استعلام وضعیت پرداخت از بانک",
    };
  }
}

/**
 * Relational lookup for a payment attempt by provider and trackId
 */
export async function findPaymentAttempt(provider: string, trackId: string): Promise<PaymentAttemptRow | null> {
  if (db || process.env.DATABASE_URL) {
    try {
      const rows = await db!
        .select()
        .from(paymentAttempts)
        .where(
          and(
            eq(paymentAttempts.provider, provider),
            eq(paymentAttempts.trackId, trackId),
          ),
        )
        .limit(1);
      return rows[0] || null;
    } catch (err) {
      if (process.env.DATABASE_URL) {
        console.error("Database error looking up payment attempt:", err);
        throw err;
      }
    }
  }

  assertMemoryStoreAllowed("payment-attempt lookup");
  const attempts = getMemoryPaymentAttempts();
  const match = attempts.find((a) => a.provider === provider && a.trackId === trackId);
  if (match) {
    return {
      id: match.id,
      orderId: match.orderId,
      provider: match.provider,
      trackId: match.trackId,
      amount: match.amount,
      amountRials: match.amountRials,
      status: match.status,
      paymentLink: match.paymentLink,
      verifiedRef: match.verifiedRef,
      rawGatewayResponse: match.rawGatewayResponse || {},
      createdAt: match.createdAt,
      updatedAt: match.updatedAt,
    };
  }
  return null;
}

/**
 * Inserts or records a new payment attempt row bound to orderId.
 */
export async function recordPaymentAttempt(attempt: {
  orderId: number;
  provider?: string;
  trackId: string;
  amountTomans: number;
  paymentLink?: string;
  status?: string;
  rawGatewayResponse?: Record<string, unknown>;
}): Promise<PaymentAttemptRow> {
  const provider = attempt.provider || "zibal";
  const amountRials = Math.round(attempt.amountTomans * 10);
  const status = attempt.status || "pending";
  const paymentLink = attempt.paymentLink || "";
  const now = new Date();

  if (db || process.env.DATABASE_URL) {
    try {
      const inserted = await db!
        .insert(paymentAttempts)
        .values({
          orderId: attempt.orderId,
          provider,
          trackId: attempt.trackId,
          amount: attempt.amountTomans,
          amountRials,
          status,
          paymentLink,
          rawGatewayResponse: attempt.rawGatewayResponse || {},
          createdAt: now,
          updatedAt: now,
        })
        .returning();
      return inserted[0];
    } catch (err) {
      if (process.env.DATABASE_URL) {
        console.error("Database error inserting payment attempt:", err);
        throw err;
      }
    }
  }

  assertMemoryStoreAllowed("payment-attempt creation");
  const memAttempts = getMemoryPaymentAttempts();
  const newRow: PaymentAttemptRow = {
    id: memAttempts.length + 1,
    orderId: attempt.orderId,
    provider,
    trackId: attempt.trackId,
    amount: attempt.amountTomans,
    amountRials,
    status,
    paymentLink,
    verifiedRef: "",
    rawGatewayResponse: attempt.rawGatewayResponse || {},
    createdAt: now,
    updatedAt: now,
  };
  memAttempts.push({
    ...newRow,
    status: newRow.status as "pending" | "paid" | "failed" | "superseded" | "duplicate_paid",
  });
  return newRow;
}

/**
 * Atomically updates an order with a new paymentTrackId and paymentLink upon payment retry,
 * creating an explicit payment_attempts row and enforcing that paymentStatus is NOT already 'paid'.
 */
export async function atomicUpdateOrderPaymentRetry(
  orderId: number,
  newTrackId: string,
  newPaymentLink: string,
): Promise<OrderRow | null> {
  const now = new Date();
  if (db || process.env.DATABASE_URL) {
    try {
      return await db!.transaction(async (tx: any) => {
        // 1. Lock order row for update and check current paymentStatus
        const currentOrders = await tx
          .select()
          .from(orders)
          .where(eq(orders.id, orderId))
          .for("update")
          .limit(1);
        const existingOrder = currentOrders[0];

        if (!existingOrder || existingOrder.paymentStatus === "paid") {
          if (existingOrder) {
            await tx.insert(paymentAttempts).values({
              orderId,
              provider: "zibal",
              trackId: newTrackId,
              amount: existingOrder.totalAmount,
              amountRials: Math.round(existingOrder.totalAmount * 10),
              status: "superseded",
              paymentLink: newPaymentLink,
              rawGatewayResponse: { reason: "order_already_paid_before_retry_activation" },
              createdAt: now,
              updatedAt: now,
            });
          }
          return null;
        }

        // 2. Mark previous pending attempts for this order as superseded
        await tx
          .update(paymentAttempts)
          .set({ status: "superseded", updatedAt: now })
          .where(
            and(
              eq(paymentAttempts.orderId, orderId),
              eq(paymentAttempts.status, "pending"),
            ),
          );

        // 3. Insert new payment attempt row (unique index on provider+trackId prevents collisions)
        await tx.insert(paymentAttempts).values({
          orderId,
          provider: "zibal",
          trackId: newTrackId,
          amount: existingOrder.totalAmount,
          amountRials: Math.round(existingOrder.totalAmount * 10),
          status: "pending",
          paymentLink: newPaymentLink,
          createdAt: now,
          updatedAt: now,
        });

        // 4. Update active order trackId and paymentLink
        const updatedOrders = await tx
          .update(orders)
          .set({
            paymentTrackId: newTrackId,
            paymentLink: newPaymentLink,
            paymentStatus: "pending",
            updatedAt: now,
          })
          .where(
            and(
              eq(orders.id, orderId),
              ne(orders.paymentStatus, "paid"),
            ),
          )
          .returning();

        if (updatedOrders[0]) return updatedOrders[0];
        return null;
      });
    } catch (err) {
      if (process.env.DATABASE_URL) {
        console.error("Transaction error during order payment retry:", err);
        throw new Error("خطا در ثبت تلاش مجدد پرداخت در پایگاه داده");
      }
    }
  }

  // Explicit local demo-only memory fallback when DB is not configured.
  assertMemoryStoreAllowed("payment retry");
  const mem = getMemoryStore();
  const order = mem.orders.find((o: OrderRow) => o.id === orderId);
  if (order) {
    if (order.paymentStatus === "paid") return null;

    // Supersede older memory attempts
    const memAttempts = getMemoryPaymentAttempts();
    for (const a of memAttempts) {
      if (a.orderId === orderId && a.status === "pending") {
        a.status = "superseded";
        a.updatedAt = now;
      }
    }

    // Add new attempt
    memAttempts.push({
      id: memAttempts.length + 1,
      orderId,
      provider: "zibal",
      trackId: newTrackId,
      amount: order.totalAmount,
      amountRials: Math.round(order.totalAmount * 10),
      status: "pending",
      paymentLink: newPaymentLink,
      verifiedRef: "",
      rawGatewayResponse: {},
      createdAt: now,
      updatedAt: now,
    });

    order.paymentTrackId = newTrackId;
    order.paymentLink = newPaymentLink;
    order.paymentStatus = "pending";
    order.updatedAt = now;
    return order;
  }
  return null;
}

/** Records a canceled/failed gateway callback against its exact relational attempt. */
export async function recordPaymentCallbackFailure(
  trackingCode: string,
  callbackTrackId: string,
  reason: string,
): Promise<boolean> {
  const cleanTrackId = String(callbackTrackId || "").trim();
  if (!trackingCode || !cleanTrackId) return false;
  const order = await getOrderByTrackingCode(trackingCode);
  const attempt = await findPaymentAttempt("zibal", cleanTrackId);
  if (!order || !attempt || attempt.orderId !== order.id) return false;

  const metadata = safeGatewayMetadata({ error: reason });
  const now = new Date();
  if (db || process.env.DATABASE_URL) {
    return db!.transaction(async (tx: any) => {
      const lockedOrders = await tx.select().from(orders).where(eq(orders.id, order.id)).for("update").limit(1);
      const lockedAttempts = await tx.select().from(paymentAttempts).where(eq(paymentAttempts.id, attempt.id)).for("update").limit(1);
      const lockedOrder = lockedOrders[0];
      const lockedAttempt = lockedAttempts[0];
      if (!lockedOrder || !lockedAttempt) return false;
      if (lockedAttempt.status === "paid" || lockedAttempt.status === "duplicate_paid") return true;
      await tx.update(paymentAttempts).set({ status: "failed", rawGatewayResponse: metadata, updatedAt: now }).where(eq(paymentAttempts.id, lockedAttempt.id));
      if (lockedOrder.paymentStatus !== "paid" && lockedOrder.paymentTrackId === cleanTrackId) {
        await tx.update(orders).set({ paymentStatus: "failed", updatedAt: now }).where(eq(orders.id, lockedOrder.id));
      }
      return true;
    });
  }

  assertMemoryStoreAllowed("failed payment callback");
  const memoryAttempt = getMemoryPaymentAttempts().find((item) => item.id === attempt.id);
  if (!memoryAttempt) return false;
  if (memoryAttempt.status !== "paid" && memoryAttempt.status !== "duplicate_paid") {
    memoryAttempt.status = "failed";
    memoryAttempt.rawGatewayResponse = metadata;
    memoryAttempt.updatedAt = now;
  }
  const memoryOrder = getMemoryStore().orders.find((item) => item.id === order.id);
  if (memoryOrder && memoryOrder.paymentStatus !== "paid" && memoryOrder.paymentTrackId === cleanTrackId) {
    memoryOrder.paymentStatus = "failed";
    memoryOrder.updatedAt = now;
  }
  return true;
}

/**
 * Securely processes payment verification bound to a specific order & relational payment attempt:
 * 1. Loads the order and performs relational lookup in payment_attempts
 * 2. Verifies transaction with Zibal
 * 3. FAILS CLOSED if amount is missing or not a positive number
 * 4. Verifies returned amount matches order total in Rials (order.totalAmount * 10)
 * 5. Reconciles payment:
 *    - Uses a PostgreSQL row-level locking transaction ('FOR UPDATE') on both the order and attempt
 *    - If order is already paid with a DIFFERENT refNumber -> flags as DUPLICATE CHARGE for refund
 *    - If order is not paid -> settles order as PAID and marks attempt as PAID
 */
export async function processOrderPaymentVerification(
  trackingCode: string,
  callbackTrackId: string,
  mockZibalVerifyOverride?: (trackId: string) => Promise<PaymentVerifyResult>,
): Promise<OrderPaymentProcessResult> {
  if (!trackingCode || !callbackTrackId) {
    return { success: false, error: "کد پیگیری سفارش و شناسه پرداخت الزامی است." };
  }

  // 1. Load the order first
  const order = await getOrderByTrackingCode(trackingCode);
  if (!order) {
    return { success: false, error: "سفارشی با این کد پیگیری یافت نشد." };
  }

  const cleanTrackId = String(callbackTrackId).trim();

  // 2. Exact relational lookup in payment_attempts
  let attempt = await findPaymentAttempt("zibal", cleanTrackId);

  // If no attempt row exists yet (e.g., initial creation without explicit attempt row), verify if cleanTrackId matches order.paymentTrackId
  if (!attempt) {
    if (order.paymentTrackId && cleanTrackId === order.paymentTrackId.trim()) {
      attempt = await recordPaymentAttempt({
        orderId: order.id,
        provider: "zibal",
        trackId: cleanTrackId,
        amountTomans: order.totalAmount,
        paymentLink: order.paymentLink,
      });
    } else {
      return {
        success: false,
        error: "شناسه تراکنش پرداخت در فهرست تلاش‌های این سفارش یافت نشد.",
      };
    }
  }

  // Verify attempt belongs to this order
  if (attempt.orderId !== order.id) {
    return {
      success: false,
      error: "شناسه تراکنش با شماره سفارش مطابقت ندارد. از پرداخت ناشی از سفارش دیگر جلوگیری شد.",
    };
  }

  // 3. Verify the transaction with Zibal
  const verifyFn = mockZibalVerifyOverride || verifyZibalPayment;
  const verifyRes = await verifyFn(cleanTrackId);

  if (!verifyRes.success) {
    // Record failed attempt
    if (db || process.env.DATABASE_URL) {
      await db!
        .update(paymentAttempts)
        .set({ status: "failed", rawGatewayResponse: safeGatewayMetadata(verifyRes), updatedAt: new Date() })
        .where(eq(paymentAttempts.id, attempt.id));
    } else {
      assertMemoryStoreAllowed("failed payment verification");
      const memoryAttempt = getMemoryPaymentAttempts().find((item) => item.id === attempt!.id);
      if (memoryAttempt) {
        memoryAttempt.status = "failed";
        memoryAttempt.rawGatewayResponse = safeGatewayMetadata(verifyRes);
        memoryAttempt.updatedAt = new Date();
      }
    }
    return {
      success: false,
      error: verifyRes.error || "تأیید تراکنش بانکی با خطا مواجه شد.",
    };
  }

  // 4. FAIL CLOSED: Reject if Zibal returns no valid numeric amount
  if (typeof verifyRes.rawAmountRials !== "number" || isNaN(verifyRes.rawAmountRials) || verifyRes.rawAmountRials <= 0) {
    if (db) await db.update(paymentAttempts).set({ status: "failed", rawGatewayResponse: safeGatewayMetadata({ ...verifyRes, error: "invalid_or_missing_amount" }), updatedAt: new Date() }).where(eq(paymentAttempts.id, attempt.id));
    return {
      success: false,
      error: "مبلغ دریافتی از درگاه پرداخت نامعتبر یا ناموجود است.",
    };
  }

  // 5. Verify returned payment amount exactly matches order total in Rials (orderTotalTomans * 10)
  const expectedRials = Math.round(Number(order.totalAmount) * 10);
  if (verifyRes.rawAmountRials !== expectedRials) {
    if (db) await db.update(paymentAttempts).set({ status: "failed", rawGatewayResponse: safeGatewayMetadata({ ...verifyRes, error: "amount_mismatch" }), updatedAt: new Date() }).where(eq(paymentAttempts.id, attempt.id));
    return {
      success: false,
      error: `مبلغ پرداخت‌شده (${verifyRes.rawAmountRials} ریال) با مبلغ کل سفارش (${expectedRials} ریال) مغایرت دارد.`,
    };
  }

  const verifiedRefNumber = verifyRes.refNumber || `REF-${cleanTrackId}`;
  const now = verifyRes.paidAt || new Date();

  // 6. Database Transaction with row-level locking (FOR UPDATE) to prevent race conditions
  if (db || process.env.DATABASE_URL) {
    try {
      const txResult = await db!.transaction(async (tx: any) => {
        // Lock order row
        const freshOrders = await tx
          .select()
          .from(orders)
          .where(eq(orders.id, order.id))
          .for("update")
          .limit(1);
        const freshOrder = freshOrders[0];

        if (!freshOrder) {
          return { success: false, error: "سفارش در حین پردازش یافت نشد." };
        }

        // Lock attempt row
        const freshAttempts = await tx
          .select()
          .from(paymentAttempts)
          .where(eq(paymentAttempts.id, attempt!.id))
          .for("update")
          .limit(1);
        const freshAttempt = freshAttempts[0];

        if (!freshAttempt) {
          return { success: false, error: "تلاش پرداخت در حین پردازش یافت نشد." };
        }

        // Handle Already Paid / Duplicate Charges
        if (freshOrder.paymentStatus === "paid") {
          if (
            freshAttempt.verifiedRef === verifiedRefNumber ||
            freshOrder.paymentRefId === verifiedRefNumber ||
            freshOrder.paymentTrackId === cleanTrackId
          ) {
            return {
              success: true,
              alreadyPaid: true,
              refNumber: freshOrder.paymentRefId || verifiedRefNumber,
              amount: freshOrder.totalAmount,
              paidAt: freshOrder.paidAt || freshOrder.updatedAt,
            };
          }

          // DUPLICATE CHARGE ESCALATION
          const warningMsg = `[هشدار پرداخت دوتایی]: تراکنش ثانویه به مبلغ ${freshOrder.totalAmount} تومان با کد مرجع ${verifiedRefNumber} انجام شد - نیاز به استرداد وجه`;

          await tx
            .update(paymentAttempts)
            .set({ status: "duplicate_paid", verifiedRef: verifiedRefNumber, rawGatewayResponse: safeGatewayMetadata(verifyRes), updatedAt: now })
            .where(eq(paymentAttempts.id, freshAttempt.id));

          await tx
            .update(orders)
            .set({
              adminNotes: `${freshOrder.adminNotes || ""} ${warningMsg}`.trim(),
              updatedAt: now,
            })
            .where(eq(orders.id, freshOrder.id));

          return {
            success: true,
            alreadyPaid: true,
            duplicatePaid: true,
            refNumber: verifiedRefNumber,
            amount: freshOrder.totalAmount,
            paidAt: now,
            warning: "تراکنش دوتایی به ثبت رسید؛ ارسال به مدیریت جهت بررسی و استرداد وجه.",
          };
        }

        // Fresh Order Settlement
        await tx
          .update(paymentAttempts)
          .set({
            status: "paid",
            verifiedRef: verifiedRefNumber,
            rawGatewayResponse: safeGatewayMetadata(verifyRes),
            updatedAt: now,
          })
          .where(eq(paymentAttempts.id, freshAttempt.id));

        await tx
          .update(orders)
          .set({
            paymentStatus: "paid",
            paymentRefId: verifiedRefNumber,
            paymentTrackId: cleanTrackId,
            paidAt: now,
            updatedAt: now,
          })
          .where(eq(orders.id, freshOrder.id));

        return {
          success: true,
          alreadyPaid: false,
          refNumber: verifiedRefNumber,
          amount: freshOrder.totalAmount,
          paidAt: now,
        };
      });

      return txResult;
    } catch (err) {
      console.error("Payment verification transaction failed:", err);
      return { success: false, error: "خطا در ثبت وضعیت پرداخت در پایگاه داده" };
    }
  }

  // Explicit local demo-only memory fallback update.
  assertMemoryStoreAllowed("payment verification");
  const memStore = getMemoryStore();
  const memOrder = memStore.orders.find((o) => o.id === order.id);

  if (memOrder) {
    if (memOrder.paymentStatus === "paid") {
      if (attempt.verifiedRef === verifiedRefNumber || memOrder.paymentRefId === verifiedRefNumber) {
        return {
          success: true,
          alreadyPaid: true,
          refNumber: memOrder.paymentRefId || verifiedRefNumber,
          amount: memOrder.totalAmount,
          paidAt: memOrder.paidAt || memOrder.updatedAt,
        };
      }

      attempt.status = "duplicate_paid";
      attempt.verifiedRef = verifiedRefNumber;
      memOrder.adminNotes = `${memOrder.adminNotes || ""} [هشدار پرداخت دوتایی]: کد مرجع ${verifiedRefNumber}`.trim();

      return {
        success: true,
        alreadyPaid: true,
        duplicatePaid: true,
        refNumber: verifiedRefNumber,
        amount: memOrder.totalAmount,
        paidAt: now,
        warning: "تراکنش دوتایی به ثبت رسید؛ ارسال به مدیریت جهت بررسی و استرداد وجه.",
      };
    }

    memOrder.paymentStatus = "paid";
    memOrder.paymentRefId = verifiedRefNumber;
    memOrder.paymentTrackId = cleanTrackId;
    memOrder.paidAt = now;
  }

  return {
    success: true,
    alreadyPaid: false,
    refNumber: verifiedRefNumber,
    amount: order.totalAmount,
    paidAt: now,
  };
}
