import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createSuggestion, getAllSuggestions, sanitizeSuggestion } from "@/lib/content-store";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  return NextResponse.json({ ok: true, suggestions: await getAllSuggestions() });
}

export async function POST(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  try {
    const suggestion = await createSuggestion(sanitizeSuggestion(await req.json()));
    return NextResponse.json({ ok: true, suggestion });
  } catch (error) {
    const message = error instanceof Error ? error.message : "خطای سرور";
    const duplicate = /unique|duplicate/i.test(message);
    return NextResponse.json({ ok: false, error: duplicate ? "این پیشنهاد قبلاً تعریف شده است" : message }, { status: duplicate ? 409 : 400 });
  }
}
