import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { deleteSuggestion, sanitizeSuggestion, updateSuggestion } from "@/lib/content-store";

export const dynamic = "force-dynamic";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  try {
    const id = Number((await params).id);
    if (!Number.isInteger(id)) return NextResponse.json({ ok: false, error: "شناسه نامعتبر" }, { status: 400 });
    const suggestion = await updateSuggestion(id, sanitizeSuggestion(await req.json()));
    if (!suggestion) return NextResponse.json({ ok: false, error: "پیشنهاد پیدا نشد" }, { status: 404 });
    return NextResponse.json({ ok: true, suggestion });
  } catch (error) {
    const message = error instanceof Error ? error.message : "خطای سرور";
    const duplicate = /unique|duplicate/i.test(message);
    return NextResponse.json({ ok: false, error: duplicate ? "این پیشنهاد قبلاً تعریف شده است" : message }, { status: duplicate ? 409 : 400 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const id = Number((await params).id);
  if (!Number.isInteger(id)) return NextResponse.json({ ok: false, error: "شناسه نامعتبر" }, { status: 400 });
  await deleteSuggestion(id);
  return NextResponse.json({ ok: true });
}
