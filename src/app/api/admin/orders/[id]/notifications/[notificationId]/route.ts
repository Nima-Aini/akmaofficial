import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/db";
import { smsNotifications } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string; notificationId: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
  if (!db) return NextResponse.json({ error: "پایگاه داده در دسترس نیست" }, { status: 503 });
  const { id, notificationId } = await params;
  if (!/^[1-9]\d*$/.test(id) || !/^[1-9]\d*$/.test(notificationId)) return NextResponse.json({ error: "شناسه نامعتبر" }, { status: 400 });
  const rows = await db.update(smsNotifications).set({ status: "retry_pending", nextAttemptAt: new Date() })
    .where(and(eq(smsNotifications.id, Number(notificationId)), eq(smsNotifications.orderId, Number(id)), eq(smsNotifications.status, "permanently_failed")))
    .returning({ id: smsNotifications.id });
  if (!rows.length) return NextResponse.json({ error: "این پیام برای تلاش مجدد خودکار مجاز نیست" }, { status: 409 });
  return NextResponse.json({ ok: true });
}
