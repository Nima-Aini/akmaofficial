"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, PackageSearch } from "lucide-react";
import { CATEGORIES } from "@/lib/defaults";
import { ProductCard } from "@/components/product-card";
import { toFa } from "@/lib/format";
import type { ProductRow } from "@/db/schema";

type SortKey = "default" | "cheap" | "expensive" | "name";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "default", label: "پیش‌فرض" },
  { key: "cheap", label: "ارزان‌ترین" },
  { key: "expensive", label: "گران‌ترین" },
  { key: "name", label: "نام" },
];

export function CatalogClient({
  products,
  phone,
}: {
  products: ProductRow[];
  phone: string;
}) {
  const params = useSearchParams();
  const urlCat = params.get("cat");
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortKey>("default");

  const cat = selectedCat ?? urlCat ?? "all";

  const filtered = useMemo(() => {
    let list = [...products];
    if (cat !== "all") list = list.filter((p) => p.category === cat);
    if (q.trim()) {
      const t = q.trim().replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)));
      list = list.filter((p) =>
        `${p.name} ${p.subtitle} ${p.categoryLabel}`.includes(t) ||
        `${p.name} ${p.subtitle} ${p.categoryLabel}`.includes(q.trim()),
      );
    }
    switch (sort) {
      case "cheap":
        list.sort((a, b) => a.price - b.price);
        break;
      case "expensive":
        list.sort((a, b) => b.price - a.price);
        break;
      case "name":
        list.sort((a, b) => a.name.localeCompare(b.name, "fa"));
        break;
      default:
        list.sort((a, b) => a.sortOrder - b.sortOrder);
    }
    return list;
  }, [products, cat, q, sort]);

  return (
    <div className="mt-12">
      {/* toolbar */}
      <div className="card flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              onClick={() => setSelectedCat(c.key)}
              className={`chip px-4 py-2 text-xs font-semibold ${cat === c.key ? "active" : "text-muted"}`}
            >
              {c.label}
            </button>
          ))}
        </div>
        <div className="flex flex-1 items-center gap-2 lg:max-w-md">
          <div className="relative flex-1">
            <Search size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="جستجوی محصول…"
              className="field !rounded-full !pr-10"
            />
          </div>
          <div className="relative">
            <SlidersHorizontal size={15} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="field appearance-none !rounded-full !pr-9 !pl-8 text-xs"
            >
              {SORTS.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <p className="mt-6 text-xs text-muted">
        {toFa(filtered.length)} محصول
        {cat !== "all" && ` در دسته «${CATEGORIES.find((c) => c.key === cat)?.label}»`}
      </p>

      {filtered.length === 0 ? (
        <div className="card mt-6 flex flex-col items-center gap-4 py-20 text-center">
          <PackageSearch size={44} className="text-muted" strokeWidth={1.4} />
          <p className="font-extrabold">محصولی پیدا نشد</p>
          <p className="max-w-sm text-xs leading-6 text-muted">
            عبارت دیگری جستجو کنید یا دسته‌بندی را تغییر دهید.
          </p>
          <button
            onClick={() => {
              setQ("");
              setSelectedCat("all");
            }}
            className="btn btn-ghost h-10 px-6 text-xs"
          >
            حذف فیلترها
          </button>
        </div>
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} phone={phone} />
          ))}
        </div>
      )}
    </div>
  );
}
