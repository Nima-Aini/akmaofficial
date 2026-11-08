import { db } from "@/db";
import { smsNotifications, type OrderRow } from "@/db/schema";
import { sql } from "drizzle-orm";

export function smsTemplateId(kind: "payment_success" | "payment_failed" | "order_shipped"): number {
  const key = { payment_success: "MELLIPAYAMAK_BODY_ID_PAYMENT_SUCCESS", payment_failed: "MELLIPAYAMAK_BODY_ID_PAYMENT_FAILED", order_shipped: "MELLIPAYAMAK_BODY_ID_ORDER_SHIPPED" }[kind];
  const fallback = { payment_success: 556154, payment_failed: 556162, order_shipped: 556160 }[kind];
  const value = Number(process.env[key] || fallback);
  if (!Number.isSafeInteger(value) || value < 1) throw new Error(`Invalid ${key}`);
  return value;
}

export async function enqueueOrderSms(tx: any, kind: "payment_success" | "payment_failed" | "order_shipped", order: OrderRow, key: string, attemptId?: number): Promise<void> {
  const parameters = kind === "payment_success" ? [order.customerName.trim() || "مشتری", order.trackingCode, String(order.totalAmount)] : kind === "order_shipped" ? [order.trackingCode, order.shippingCode] : [order.trackingCode];
  await tx.insert(smsNotifications).values({
    idempotencyKey: key, kind, orderId: order.id, paymentAttemptId: attemptId,
    recipient: order.customerPhone, bodyId: smsTemplateId(kind), parameters,
  }).onConflictDoNothing({ target: smsNotifications.idempotencyKey });
}

export async function notificationStatus(orderId: number) {
  if (!db) return [];
  return db.select({ id: smsNotifications.id, kind: smsNotifications.kind, status: smsNotifications.status, error: smsNotifications.lastError })
    .from(smsNotifications).where(sql`${smsNotifications.orderId} = ${orderId}`).orderBy(smsNotifications.id);
}
