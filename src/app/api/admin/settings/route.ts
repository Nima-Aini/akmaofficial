import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getAllProducts, getSettings, saveSetting } from "@/lib/store";
import { sanitizeResponsiveSetting } from "@/lib/responsive-image";
import { sanitizeRichTextMetadataDeep, sanitizeRichTextValue } from "@/lib/rich-text";

export const dynamic = "force-dynamic";

const ALLOWED_KEYS = new Set([
  "theme",
  "hero",
  "dualCards",
  "categories",
  "wholesalePromo",
  "marquee",
  "marqueeFormatting",
  "banners",
  "bottomBanners",
  "sectionTitles",
  "features",
  "priceTable",
  "steps",
  "contact",
  "site",
  "branding",
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
    const sanitizedValue = key === "marqueeFormatting"
      ? (Array.isArray(value) ? value.slice(0, 100).map((entry) => sanitizeRichTextValue(entry, 2_000) ?? { segments: [] }) : [])
      : sanitizeRichTextMetadataDeep(sanitizeResponsiveSetting(key, value));
    if (key === "categories") {
      if (!Array.isArray(sanitizedValue)) return NextResponse.json({ ok: false, error: "فهرست دسته‌بندی نامعتبر است" }, { status: 400 });
      const keys = sanitizedValue.map((item: unknown) => (item && typeof item === "object" ? (item as { key?: unknown }).key : undefined));
      if (keys.some((item) => typeof item !== "string" || !/^[a-z0-9-]+$/.test(item)) || new Set(keys).size !== keys.length) {
        return NextResponse.json({ ok: false, error: "شناسهٔ دسته‌بندی باید یکتا و معتبر باشد" }, { status: 400 });
      }
      const oldCategories = (await getSettings()).categories;
      const oldKeys = Array.isArray(oldCategories) ? oldCategories.map((item: { key: string }) => item.key) : [];
      const referenced = (await getAllProducts()).map((product) => product.category);
      const missing = referenced.find((productKey) => oldKeys.includes(productKey) && !keys.includes(productKey));
      if (missing) return NextResponse.json({ ok: false, error: `دسته‌بندی ${missing} هنوز به محصول متصل است؛ شناسهٔ آن را حفظ کنید.` }, { status: 409 });
    }
    await saveSetting(key, sanitizedValue);
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error("Failed to save setting:", err);
    return NextResponse.json({ ok: false, error: "خطای سرور در ذخیره تنظیمات" }, { status: 500 });
  }
}
