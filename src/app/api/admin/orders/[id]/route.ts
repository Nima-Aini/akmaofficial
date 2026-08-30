import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { deleteOrder, getOrderById, updateOrder } from "@/lib/store";

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

  return NextResponse.json({ ok: true, order });
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

    const updated = await updateOrder(numId, patch);
    if (!updated) {
      return NextResponse.json({ error: "سفارش برای ویرایش یافت نشد" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, order: updated });
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
