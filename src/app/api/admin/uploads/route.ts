import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
  ["image/gif", ".gif"],
  ["image/avif", ".avif"],
]);

function uploadRoot() {
  return process.env.UPLOAD_DIR?.trim() || "/var/www/akmaofficial-uploads";
}

export async function POST(req: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  try {
    const form = await req.formData();
    const file = form.get("file");
    const rawKind = form.get("kind");

    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "فایلی انتخاب نشده است" }, { status: 400 });
    }

    const ext = ALLOWED.get(file.type);
    if (!ext) {
      return NextResponse.json(
        { ok: false, error: "فرمت تصویر مجاز نیست. JPG/PNG/WEBP/GIF/AVIF مجاز است." },
        { status: 400 },
      );
    }

    if (file.size <= 0 || file.size > MAX_BYTES) {
      return NextResponse.json({ ok: false, error: "حجم تصویر باید حداکثر 10MB باشد." }, { status: 400 });
    }

    const kind =
      rawKind === "banners" || rawKind === "hero" || rawKind === "products"
        ? rawKind
        : "products";

    const filename = `${Date.now()}-${crypto.randomUUID()}${ext}`;
    const relative = path.join(kind, filename);
    const root = path.resolve(uploadRoot());
    const target = path.resolve(root, relative);

    if (!target.startsWith(`${root}${path.sep}`)) {
      return NextResponse.json({ ok: false, error: "مسیر فایل نامعتبر است" }, { status: 400 });
    }

    await mkdir(path.dirname(target), { recursive: true });
    const bytes = Buffer.from(await file.arrayBuffer());
    await writeFile(target, bytes);

    return NextResponse.json({
      ok: true,
      url: `/uploads/${kind}/${filename}`,
      filename,
      size: bytes.length,
    });
  } catch (error) {
    console.error("image upload error", error);
    return NextResponse.json({ ok: false, error: "آپلود تصویر ناموفق بود" }, { status: 500 });
  }
}
