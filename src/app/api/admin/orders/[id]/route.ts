import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { deleteOrder, getOrderById, updateOrder } from "@/lib/store";
import { db, assertMemoryStoreAllowed } from "@/db";
import { orders } from "@/db/schema";
import { eq } from "drizzle-orm";
import { enqueueOrderSms, notificationStatus } from "@/lib/sms-outbox";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const isAdmin = await requireAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
  }

  const { id } = await params;
  const numId = Number(id);
  if (!numId) {
    return NextResponse.json({ error: "شناسه سفارش نامعتبر است" }, { status: 400 });
  }

  const order = await getOrderById(numId);
  if (!order) {
    return NextResponse.json({ error: "سفارش یافت نشد" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, order, notifications: await notificationStatus(numId) });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const isAdmin = await requireAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
  }

  const { id } = await params;
  const numId = Number(id);
  if (!numId) {
    return NextResponse.json({ error: "شناسه سفارش نامعتبر است" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const patch: Record<string, unknown> = {};

    if (typeof body.status === "string") {
      patch.status = body.status;
    }
    if (typeof body.shippingCode === "string") {
      patch.shippingCode = body.shippingCode.trim();
    }
    if (typeof body.trackingLink === "string") {
      patch.trackingLink = body.trackingLink.trim();
    }
    if (typeof body.adminNotes === "string") {
      patch.adminNotes = body.adminNotes.trim();
    }
    if (typeof body.customerAddress === "string") {
      patch.customerAddress = body.customerAddress.trim();
    }
    if (typeof body.notes === "string") {
      patch.notes = body.notes.trim();
    }

    if (patch.status && !["pending", "processing", "shipped", "delivered", "cancelled"].includes(String(patch.status))) {
      return NextResponse.json({ error: "وضعیت سفارش نامعتبر است" }, { status: 400 });
    }
    if (patch.shippingCode && (!/^[\p{L}\p{N}][\p{L}\p{N}\s._\-/]{2,79}$/u.test(String(patch.shippingCode)))) {
      return NextResponse.json({ error: "کد رهگیری نامعتبر است" }, { status: 400 });
    }
    if (patch.status === "shipped" && !patch.shippingCode) {
      const existing = await getOrderById(numId);
      if (!existing?.shippingCode) return NextResponse.json({ error: "کد رهگیری ارسال الزامی است" }, { status: 400 });
    }
    if (!db) assertMemoryStoreAllowed("shipping notifications");
    const result = db ? await db.transaction(async (tx: any) => {
      const current = (await tx.select().from(orders).where(eq(orders.id, numId)).for("update").limit(1))[0];
      if (!current) return null;
      const next = { ...current, ...patch };
      if (next.status === "shipped" && !next.shippingCode) throw new Error("Missing shipping code");
      if (current.status === "cancelled" && next.status === "shipped") throw new Error("Canceled order cannot be shipped");
      const updated = (await tx.update(orders).set({ ...patch, updatedAt: new Date() }).where(eq(orders.id, numId)).returning())[0];
      if (next.status === "shipped" && (current.status !== "shipped" || current.shippingCode !== next.shippingCode)) {
        // Corrections create a distinct notification; an identical save is idempotent.
        await enqueueOrderSms(tx, "order_shipped", updated, `shipped:${numId}:${next.shippingCode}`);
      }
      return updated;
    }) : await updateOrder(numId, patch);
    if (!result) return NextResponse.json({ error: "سفارش برای ویرایش یافت نشد" }, { status: 404 });
    return NextResponse.json({ ok: true, order: result, notifications: await notificationStatus(numId) });
  } catch (error) {
    console.error("Admin order update error:", error);
    return NextResponse.json({ error: "خطا در به‌روزرسانی سفارش" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const isAdmin = await requireAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
  }

  const { id } = await params;
  const numId = Number(id);
  if (!numId) {
    return NextResponse.json({ error: "شناسه سفارش نامعتبر است" }, { status: 400 });
  }

  const ok = await deleteOrder(numId);
  if (!ok) {
    return NextResponse.json({ error: "سفارش یافت نشد" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
