import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { deleteBlogPost, sanitizeBlogPost, updateBlogPost } from "@/lib/content-store";

export const dynamic = "force-dynamic";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  try {
    const id = Number((await params).id);
    if (!Number.isInteger(id)) return NextResponse.json({ ok: false, error: "شناسه نامعتبر" }, { status: 400 });
    const post = await updateBlogPost(id, sanitizeBlogPost(await req.json()));
    if (!post) return NextResponse.json({ ok: false, error: "مقاله پیدا نشد" }, { status: 404 });
    return NextResponse.json({ ok: true, post });
  } catch (error) {
    const message = error instanceof Error ? error.message : "خطای سرور";
    const duplicate = /unique|duplicate/i.test(message);
    return NextResponse.json({ ok: false, error: duplicate ? "این آدرس مقاله قبلاً استفاده شده است" : message }, { status: duplicate ? 409 : 400 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const id = Number((await params).id);
  if (!Number.isInteger(id)) return NextResponse.json({ ok: false, error: "شناسه نامعتبر" }, { status: 400 });
  await deleteBlogPost(id);
  return NextResponse.json({ ok: true });
}
