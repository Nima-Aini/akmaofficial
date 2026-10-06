"use client";

import { useState } from "react";
import { Pencil, Plus, Save, Star, Trash2, X } from "lucide-react";
import { CATEGORIES } from "@/lib/defaults";
import { formatPrice } from "@/lib/format";
import { Field, ImageUploader, ListEditor, Textarea, Toggle } from "./fields";
import { getProductImages } from "@/lib/product-media";

export type AdminProduct = {
  id: number;
  name: string;
  slug: string;
  subtitle: string;
  description: string;
  features: string[];
  contents: string[];
  price: number;
  retailPrice?: number;
  retailUnitLabel?: string;
  wholesalePrice?: number;
  wholesaleMinQty?: number;
  wholesalePackSize?: number | null;
  wholesalePackLabel?: string;
  wholesaleMinPackQty?: number | null;
  wholesaleTiers?: { minQty: number; price: number; label?: string }[];
  isRetail?: boolean;
  isWholesale?: boolean;
  videoUrl?: string;
  unitPrice: string;
  category: string;
  categoryLabel: string;
  images: string[];
  retailImages?: string[];
  wholesaleImages?: string[];
  badge: string;
  inStock: boolean;
  featured: boolean;
  sortOrder: number;
  active: boolean;
};

const EMPTY: Omit<AdminProduct, "id"> = {
  name: "",
  slug: "",
  subtitle: "",
  description: "",
  features: [],
  contents: [],
  price: 0,
  retailPrice: 0,
  retailUnitLabel: "عدد",
  wholesalePrice: 0,
  wholesaleMinQty: 1,
  wholesalePackSize: null,
  wholesalePackLabel: "",
  wholesaleMinPackQty: null,
  wholesaleTiers: [],
  isRetail: true,
  isWholesale: true,
  videoUrl: "",
  unitPrice: "",
  category: "foam",
  categoryLabel: "تمیزکننده کفش",
  images: ["/images/redesign/cat-foam.jpg"],
  retailImages: [],
  wholesaleImages: [],
  badge: "",
  inStock: true,
  featured: false,
  sortOrder: 0,
  active: true,
};

export function ProductsSection({
  products,
  setProducts,
  toast,
}: {
  products: AdminProduct[];
  setProducts: (p: AdminProduct[]) => void;
  toast: (m: string, ok?: boolean) => void;
}) {
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);

  function openNew() {
    setIsNew(true);
    setEditing({ id: 0, ...EMPTY, sortOrder: (products.at(-1)?.sortOrder ?? 0) + 1 });
  }

  async function save() {
    if (!editing) return;
    setSaving(true);
    try {
      const payload = {
        ...editing,
        retailPrice: Number(editing.retailPrice) || editing.price,
        wholesalePrice: Number(editing.wholesalePrice) || editing.price,
        wholesaleMinQty: Math.max(1, Number(editing.wholesaleMinQty) || 1),
        wholesalePackSize: editing.wholesalePackSize ? Math.max(1, Math.trunc(Number(editing.wholesalePackSize))) : null,
        wholesaleMinPackQty: editing.wholesaleMinPackQty ? Math.max(1, Math.trunc(Number(editing.wholesaleMinPackQty))) : null,
      };
      const res = await fetch(
        isNew ? "/api/admin/products" : `/api/admin/products/${editing.id}`,
        {
          method: isNew ? "POST" : "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await res.json();
      if (!res.ok || !data.ok) {
        toast(data.error ?? "خطا در ذخیره محصول", false);
      } else {
        const saved = data.product as AdminProduct;
        setProducts(
          isNew
            ? [...products, saved]
            : products.map((p) => (p.id === saved.id ? saved : p)),
        );
        toast(isNew ? "محصول جدید ایجاد شد" : "محصول به‌روزرسانی شد");
        setEditing(null);
      }
    } catch {
      toast("خطا در ارتباط با سرور", false);
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    if (!confirm("این محصول برای همیشه حذف شود؟")) return;
    const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    if (res.ok) {
      setProducts(products.filter((p) => p.id !== id));
      toast("محصول حذف شد");
    } else {
      toast("خطا در حذف", false);
    }
  }

  const patch = (v: Partial<AdminProduct>) =>
    setEditing((e) => (e ? { ...e, ...v } : e));

  const addTier = () => {
    if (!editing) return;
    const current = editing.wholesaleTiers || [];
    const lastMin = current.length > 0 ? Math.max(...current.map((t) => t.minQty)) : 6;
    const newTier = {
      minQty: lastMin + 6,
      price: Math.max(0, (editing.wholesalePrice || editing.price) - 10000),
      label: `${lastMin + 6}+ بسته`,
    };
    patch({ wholesaleTiers: [...current, newTier] });
  };

  const removeTier = (idx: number) => {
    if (!editing || !editing.wholesaleTiers) return;
    patch({ wholesaleTiers: editing.wholesaleTiers.filter((_, i) => i !== idx) });
  };

  return (
    <div className="card p-6 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-black">مدیریت محصولات و قیمت‌های تکی / عمده</h3>
          <p className="mt-1 text-xs text-muted">
            تنظیم روشن فروش تکی، بسته‌های عمده، قیمت پلکانی بر اساس تعداد بسته و تصاویر هر حالت.
          </p>
        </div>
        <button onClick={openNew} className="btn btn-primary h-11 px-6 text-xs">
          <Plus size={15} /> محصول جدید
        </button>
      </div>

      <div className="mt-7 space-y-3">
        {products.map((p) => (
          <div
            key={p.id}
            className="flex flex-wrap items-center gap-4 rounded-2xl border border-line p-4 transition-colors hover:border-accent/50"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={getProductImages(p, "retail")[0]}
              alt={p.name}
              className="size-14 rounded-xl border border-line object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-extrabold">
                {p.name}
                {p.featured && <Star size={13} className="mr-1.5 inline text-accent" />}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-muted">
                <span>دسته‌بندی: {p.categoryLabel}</span>
                <span>• تکی: {formatPrice(p.retailPrice || p.price)} ت</span>
                <span>• عمده: {formatPrice(p.wholesalePrice || p.price)} ت</span>
                {!p.active && <span className="text-rose-400 font-bold">(غیرفعال)</span>}
                {!p.inStock && <span className="text-amber-400 font-bold">(ناموجود)</span>}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setIsNew(false);
                  setEditing({ ...p });
                }}
                className="btn btn-ghost h-10 px-4 text-xs"
              >
                <Pencil size={14} /> ویرایش
              </button>
              <button
                onClick={() => remove(p.id)}
                className="grid size-10 place-items-center rounded-xl border border-line text-rose-400 transition-colors hover:border-rose-400"
                aria-label={`حذف ${p.name}`}
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Editor Modal */}
      {editing && (
        <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm sm:p-8">
          <div className="card my-auto w-full max-w-3xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <h4 className="text-lg font-black">
                {isNew ? "ایجاد محصول جدید" : `ویرایش «${editing.name}»`}
              </h4>
              <button
                onClick={() => setEditing(null)}
                className="grid size-10 place-items-center rounded-xl border border-line transition-colors hover:border-rose-400 hover:text-rose-400"
                aria-label="بستن"
              >
                <X size={17} />
              </button>
            </div>

            <div className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="نام محصول" value={editing.name} onChange={(v) => patch({ name: v })} />
                <Field
                  label="اسلاگ (آدرس صفحه)"
                  value={editing.slug}
                  onChange={(v) => patch({ slug: v })}
                  dir="ltr"
                  hint="خالی بماند = ساخت خودکار از نام"
                />
              </div>

              <Field
                label="زیرعنوان (مثلاً: فرمولاسیون بدون نیاز به آب)"
                value={editing.subtitle}
                onChange={(v) => patch({ subtitle: v })}
              />

              <div className="rounded-2xl border border-line bg-surface/50 p-4 space-y-4">
                <h5 className="text-sm font-black text-ink">فروش تکی</h5>
                <Toggle label="فعال بودن فروش تکی" checked={editing.isRetail !== false} onChange={(v) => patch({ isRetail: v })} />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="قیمت خرید تکی (تومان)"
                    type="number"
                    value={editing.retailPrice ?? editing.price}
                    onChange={(v) => patch({ retailPrice: Number(v) || 0, price: Number(v) || 0 })}
                    dir="ltr"
                  />
                  <Field
                    label="واحد فروش تکی"
                    value={editing.retailUnitLabel || "عدد"}
                    onChange={(v) => patch({ retailUnitLabel: v })}
                    hint="نمونه: عدد، بطری، جفت"
                  />
                </div>
                <ImageUploader label="تصاویر فروش تکی" value={editing.retailImages || []} multiple onChange={(images) => patch({ retailImages: Array.isArray(images) ? images : [images] })} kind="products" guideline="productRetail" />
                <div className="rounded-xl border border-line bg-card p-3 text-xs"><span className="text-muted">پیش‌نمایش مشتری: </span><b>۱ {editing.retailUnitLabel || "عدد"}</b></div>
              </div>

              <div className="rounded-2xl border border-line bg-surface/50 p-4 space-y-4">
                <h5 className="text-sm font-black text-ink">فروش عمده</h5>
                <Toggle label="فعال بودن فروش عمده" checked={editing.isWholesale !== false} onChange={(v) => patch({ isWholesale: v })} />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="تعداد محصول در هر بسته" type="number" value={editing.wholesalePackSize ?? ""} onChange={(v) => patch({ wholesalePackSize: v ? Number(v) : null })} dir="ltr" hint="اگر مشخص نیست خالی بگذارید؛ رفتار قدیمی حفظ می‌شود." />
                  <Field label="نام بسته" value={editing.wholesalePackLabel || ""} onChange={(v) => patch({ wholesalePackLabel: v })} hint="نمونه: بسته ۱۲ عددی" />
                  <Field label="قیمت هر بسته (تومان)" type="number" value={editing.wholesalePrice ?? editing.price} onChange={(v) => patch({ wholesalePrice: Number(v) || 0 })} dir="ltr" />
                  <Field label="حداقل تعداد بسته" type="number" value={editing.wholesaleMinPackQty ?? ""} onChange={(v) => patch({ wholesaleMinPackQty: v ? Number(v) : null })} dir="ltr" hint="خالی = استفاده از حداقل قدیمی برای سازگاری" />
                </div>
                <div className="rounded-xl border border-line bg-card p-3 text-xs"><span className="text-muted">پیش‌نمایش مشتری: </span><b>۱ {editing.wholesalePackLabel || (editing.wholesalePackSize ? `بسته ${editing.wholesalePackSize} عددی` : "بسته")}</b></div>

                {/* Wholesale Tiers */}
                <div className="space-y-3 pt-2 border-t border-line">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-muted">
                      قیمت‌گذاری پلکانی بر اساس تعداد بسته (اختیاری)
                    </span>
                    <button
                      type="button"
                      onClick={addTier}
                      className="btn btn-ghost h-8 px-3 text-xs"
                    >
                      <Plus size={13} /> افزودن پله تیراژ
                    </button>
                  </div>

                  {editing.wholesaleTiers && editing.wholesaleTiers.length > 0 ? (
                    <div className="space-y-2">
                      {editing.wholesaleTiers.map((tier, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="number"
                            placeholder="حداقل بسته"
                            value={tier.minQty}
                            onChange={(e) => {
                              const updated = [...(editing.wholesaleTiers || [])];
                              updated[idx] = { ...tier, minQty: Number(e.target.value) || 1 };
                              patch({ wholesaleTiers: updated });
                            }}
                            className="field h-10 w-28 text-center text-xs"
                            dir="ltr"
                          />
                          <input
                            type="number"
                            placeholder="قیمت هر بسته"
                            value={tier.price}
                            onChange={(e) => {
                              const updated = [...(editing.wholesaleTiers || [])];
                              updated[idx] = { ...tier, price: Number(e.target.value) || 0 };
                              patch({ wholesaleTiers: updated });
                            }}
                            className="field h-10 flex-1 text-center text-xs font-mono"
                            dir="ltr"
                          />
                          <input
                            type="text"
                            placeholder="برچسب (مثلاً: ۵+ بسته)"
                            value={tier.label || ""}
                            onChange={(e) => {
                              const updated = [...(editing.wholesaleTiers || [])];
                              updated[idx] = { ...tier, label: e.target.value };
                              patch({ wholesaleTiers: updated });
                            }}
                            className="field h-10 flex-1 text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => removeTier(idx)}
                            className="text-muted hover:text-rose-400 p-2"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-muted">
                      پله تخفیفی تعریف نشده است؛ در صورت تمایل دکمه «افزودن پله تیراژ» را بزنید.
                    </p>
                  )}
                </div>
                <ImageUploader label="تصاویر بسته‌های عمده" value={editing.wholesaleImages || []} multiple onChange={(images) => patch({ wholesaleImages: Array.isArray(images) ? images : [images] })} kind="products" guideline="productWholesale" />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold text-muted">دسته‌بندی</span>
                  <select
                    className="field"
                    value={editing.category}
                    onChange={(e) => {
                      const c = CATEGORIES.find((x) => x.key === e.target.value);
                      patch({
                        category: e.target.value,
                        categoryLabel: c?.label ?? editing.categoryLabel,
                      });
                    }}
                  >
                    {CATEGORIES.filter((c) => c.key !== "all").map((c) => (
                      <option key={c.key} value={c.key}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </label>
                <Field
                  label="ترتیب نمایش"
                  type="number"
                  value={editing.sortOrder}
                  onChange={(v) => patch({ sortOrder: Number(v) || 0 })}
                  dir="ltr"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <Toggle
                  label="فعال در فروشگاه"
                  checked={editing.active}
                  onChange={(v) => patch({ active: v })}
                />
                <Toggle
                  label="موجود در انبار"
                  checked={editing.inStock}
                  onChange={(v) => patch({ inStock: v })}
                />
                <Toggle
                  label="نمایش در منتخب / پرفروش"
                  checked={editing.featured}
                  onChange={(v) => patch({ featured: v })}
                />
              </div>

              <ImageUploader
                label="تصاویر قدیمی محصول (پشتیبان سازگاری)"
                value={editing.images}
                multiple
                onChange={(images) => patch({ images: Array.isArray(images) ? images : [images] })}
                kind="products"
                guideline="product"
                hint="برای محصولات قدیمی نگه داشته می‌شود و اگر تصاویر تکی/عمده خالی باشند نمایش داده خواهد شد."
              />

              <Textarea
                label="توضیحات کامل محصول"
                value={editing.description}
                onChange={(v) => patch({ description: v })}
                rows={6}
              />

              <ListEditor
                label="ویژگی‌های برجسته"
                items={editing.features}
                onChange={(features) => patch({ features })}
                placeholder="ویژگی جدید…"
              />

              <ListEditor
                label="محتویات بسته"
                items={editing.contents}
                onChange={(contents) => patch({ contents })}
                placeholder="آیتم جدید محتویات…"
              />
            </div>

            <div className="flex justify-end gap-3 border-t border-line pt-4">
              <button onClick={() => setEditing(null)} className="btn btn-ghost h-11 px-5 text-xs">
                انصراف
              </button>
              <button
                onClick={save}
                disabled={saving || !editing.name.trim()}
                className="btn btn-primary h-11 px-8 text-xs font-bold disabled:opacity-50"
              >
                <Save size={15} />
                {saving ? "در حال ذخیره…" : "ذخیره محصول"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
