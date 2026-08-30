import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { saveSetting } from "@/lib/store";

export const dynamic = "force-dynamic";

const ALLOWED_KEYS = new Set([
  "theme",
  "hero",
  "marquee",
  "banners",
  "bottomBanners",
  "sectionTitles",
  "features",
  "priceTable",
  "steps",
  "contact",
  "site",
]);

export async function PUT(req: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  try {
    const { key, value } = await req.json();
    if (typeof key !== "string" || !ALLOWED_KEYS.has(key)) {
      return NextResponse.json({ ok: false, error: "کلید نامعتبر است" }, { status: 400 });
    }
    await saveSetting(key, value);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "خطای سرور" }, { status: 500 });
  }
}
