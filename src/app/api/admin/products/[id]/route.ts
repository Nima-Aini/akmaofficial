import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { deleteProduct, updateProduct, sanitizeProduct } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const numId = Number(id);
    if (!Number.isInteger(numId)) {
      return NextResponse.json({ ok: false, error: "شناسه نامعتبر" }, { status: 400 });
    }
    const body = await req.json();
    const updated = await updateProduct(numId, sanitizeProduct(body));
    if (!updated) {
      return NextResponse.json({ ok: false, error: "محصول یافت نشد" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, product: updated });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "خطای سرور" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const numId = Number(id);
  if (!Number.isInteger(numId)) {
    return NextResponse.json({ ok: false, error: "شناسه نامعتبر" }, { status: 400 });
  }
  await deleteProduct(numId);
  return NextResponse.json({ ok: true });
}
