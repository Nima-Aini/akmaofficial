"use client";

import { useState } from "react";
import { Pencil, Plus, Save, Star, Trash2, X } from "lucide-react";
import { CATEGORIES } from "@/lib/defaults";
import { formatPrice } from "@/lib/format";
import { Field, ImageUploader, ListEditor, Textarea, Toggle } from "./fields";

export type AdminProduct = {
  id: number;
  name: string;
  slug: string;
  subtitle: string;
  description: string;
  features: string[];
  contents: string[];
  price: number;
  unitPrice: string;
  category: string;
  categoryLabel: string;
  images: string[];
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
  unitPrice: "",
  category: "foam",
  categoryLabel: "فوم تمیزکننده",
  images: ["/images/products/foam-bottle.png"],
  badge: "",
  inStock: true,
  featured: false,
  sortOrder: 0,
  active: true,
};

const IMAGE_PRESETS = [
  "/images/products/foam-bottle.png",
  "/images/products/foam-box.png",
  "/images/products/spray.png",
  "/images/products/polish.png",
  "/images/products/stand.png",
  "/images/hero.png",
  "/images/craft.png",
];

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
      const payload = { ...editing };
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

  return (
    <div className="card p-6 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-black">مدیریت محصولات</h3>
          <p className="mt-1 text-xs text-muted">
            نام، قیمت، توضیحات، تصاویر، موجودی و چیدمان محصولات را ویرایش کنید.
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
              src={p.images[0] ?? "/images/products/foam-bottle.png"}
              alt={p.name}
              className="size-14 rounded-xl border border-line object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-extrabold">
                {p.name}
                {p.featured && <Star size={13} className="mr-1.5 inline text-accent" />}
              </p>
              <p className="mt-1 text-[11px] text-muted">
                {p.categoryLabel} — {formatPrice(p.price)} تومان
                {!p.active && <span className="mr-2 text-rose-400">(غیرفعال)</span>}
                {!p.inStock && <span className="mr-2 text-amber-400">(ناموجود)</span>}
              </p>
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

      {/* editor modal */}
      {editing && (
        <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm sm:p-8">
          <div className="card my-auto w-full max-w-3xl p-6 sm:p-8">
            <div className="flex items-center justify-between">
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

            <div className="mt-6 space-y-5">
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
                label="زیرعنوان (مثلاً: بسته ۱۰ عددی)"
                value={editing.subtitle}
                onChange={(v) => patch({ subtitle: v })}
              />
              <div className="grid gap-5 sm:grid-cols-3">
                <Field
                  label="قیمت بسته (تومان)"
                  type="number"
                  value={editing.price}
                  onChange={(v) => patch({ price: Number(v) || 0 })}
                  dir="ltr"
                />
                <Field
                  label="متن قیمت واحد"
                  value={editing.unitPrice}
                  onChange={(v) => patch({ unitPrice: v })}
                  placeholder="قیمت واحد: ۲۴۰٫۰۰۰ تومان"
                />
                <Field
                  label="بج (مثلاً: پرفروش)"
                  value={editing.badge}
                  onChange={(v) => patch({ badge: v })}
                />
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

              <ImageUploader
                label="تصاویر محصول"
                value={editing.images}
                onChange={(v) => patch({ images: Array.isArray(v) ? v : v ? [v] : [] })}
                kind="products"
                multiple
                hint="تصویر را مستقیم از کامپیوتر انتخاب کنید؛ حداکثر ۸ تصویر، هر تصویر تا 10MB."
              />

              <ListEditor
                label="ویژگی‌های کلیدی"
                items={editing.features}
                onChange={(v) => patch({ features: v })}
                placeholder="مثلاً: بدون نیاز به شست‌وشو با آب"
              />
              <ListEditor
                label="محتویات بسته"
                items={editing.contents}
                onChange={(v) => patch({ contents: v })}
                placeholder="مثلاً: فوم تمیزکننده (۱۰ عدد)"
              />
              <Textarea
                label="توضیحات کامل محصول"
                value={editing.description}
                onChange={(v) => patch({ description: v })}
                rows={8}
                hint="برای پاراگراف جدید یک خط خالی بگذارید."
              />

              <div className="flex flex-wrap gap-3 border-t border-line pt-5">
                <Toggle label="فعال (نمایش در سایت)" checked={editing.active} onChange={(v) => patch({ active: v })} />
                <Toggle label="موجود" checked={editing.inStock} onChange={(v) => patch({ inStock: v })} />
                <Toggle label="محصول ویژه" checked={editing.featured} onChange={(v) => patch({ featured: v })} />
              </div>

              <div className="flex gap-3">
                <button onClick={save} disabled={saving} className="btn btn-primary h-12 flex-1 text-sm">
                  <Save size={16} />
                  {saving ? "در حال ذخیره…" : "ذخیره محصول"}
                </button>
                <button onClick={() => setEditing(null)} className="btn btn-ghost h-12 px-8 text-sm">
                  انصراف
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
