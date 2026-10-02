"use client";

import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, PackageSearch, Sparkles, Building2, ShoppingBag } from "lucide-react";
import { CATEGORIES } from "@/lib/defaults";
import { ProductCard } from "@/components/product-card";
import { toFa } from "@/lib/format";
import type { ProductRow } from "@/db/schema";
import { useCart } from "@/context/cart-context";

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
  const urlMode = params.get("mode") as "retail" | "wholesale" | null;

  const { cartMode, setCartMode } = useCart();
  const [mode, setMode] = useState<"retail" | "wholesale">(urlMode || cartMode || "retail");
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortKey>("default");

  useEffect(() => {
    if (urlMode) {
      queueMicrotask(() => {
        setMode(urlMode);
        setCartMode(urlMode);
      });
    }
  }, [urlMode, setCartMode]);

  const cat = selectedCat ?? urlCat ?? "all";

  const handleModeChange = (newMode: "retail" | "wholesale") => {
    setMode(newMode);
    setCartMode(newMode);
  };

  const filtered = useMemo(() => {
    let list = [...products];

    // Filter by retail / wholesale active flags
    if (mode === "retail") {
      list = list.filter((p) => p.isRetail !== false);
    } else if (mode === "wholesale") {
      list = list.filter((p) => p.isWholesale !== false);
    }

    if (cat !== "all") list = list.filter((p) => p.category === cat);
    if (q.trim()) {
      const t = q.trim().replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)));
      list = list.filter(
        (p) =>
          `${p.name} ${p.subtitle} ${p.categoryLabel}`.includes(t) ||
          `${p.name} ${p.subtitle} ${p.categoryLabel}`.includes(q.trim()),
      );
    }

    switch (sort) {
      case "cheap":
        list.sort((a, b) => {
          const priceA = mode === "wholesale" ? (a.wholesalePrice || a.price) : (a.retailPrice || a.price);
          const priceB = mode === "wholesale" ? (b.wholesalePrice || b.price) : (b.retailPrice || b.price);
          return priceA - priceB;
        });
        break;
      case "expensive":
        list.sort((a, b) => {
          const priceA = mode === "wholesale" ? (a.wholesalePrice || a.price) : (a.retailPrice || a.price);
          const priceB = mode === "wholesale" ? (b.wholesalePrice || b.price) : (b.retailPrice || b.price);
          return priceB - priceA;
        });
        break;
      case "name":
        list.sort((a, b) => a.name.localeCompare(b.name, "fa"));
        break;
      default:
        list.sort((a, b) => a.sortOrder - b.sortOrder);
    }
    return list;
  }, [products, mode, cat, q, sort]);

  return (
    <div className="mt-8 space-y-6">
      {/* 1. Mode Switcher: Retail (خرید تکی) vs Wholesale (خرید عمده) */}
      <div className="mx-auto max-w-md rounded-full bg-white p-1.5 border border-[#E7E3DC] shadow-xs flex">
        <button
          type="button"
          onClick={() => handleModeChange("retail")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-xs font-black transition-all ${
            mode === "retail"
              ? "bg-[#8E111E] text-white shadow-md shadow-[#8E111E]/20"
              : "text-[#4A423D] hover:text-[#1C1816]"
          }`}
        >
          <ShoppingBag size={14} />
          <span>خرید تکی (مصرف شخصی)</span>
        </button>

        <button
          type="button"
          onClick={() => handleModeChange("wholesale")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-xs font-black transition-all ${
            mode === "wholesale"
              ? "bg-[#8E111E] text-white shadow-md shadow-[#8E111E]/20"
              : "text-[#4A423D] hover:text-[#1C1816]"
          }`}
        >
          <Building2 size={14} />
          <span>خرید عمده (همکاران و فروشگاه‌ها)</span>
        </button>
      </div>

      {mode === "wholesale" && (
        <div className="rounded-2xl bg-[#8E111E]/5 border border-[#8E111E]/20 p-4 text-center max-w-3xl mx-auto text-xs text-[#8E111E] font-bold">
          ⚡ قیمت‌های نمایش داده شده ویژه خرید عمده بوده و تخفیف‌های پلکانی حجم در سبد خرید به طور خودکار اعمال می‌گردد.
        </div>
      )}

      {/* 2. Filters & Search Bar */}
      <div className="rounded-[2rem] border border-[#E7E3DC] bg-white p-4 shadow-xs flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Categories Chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              onClick={() => setSelectedCat(c.key)}
              className={`rounded-full px-4 py-2 text-xs font-bold transition-colors ${
                cat === c.key
                  ? "bg-[#8E111E] text-white shadow-xs"
                  : "bg-[#FAF8F5] text-[#4A423D] hover:bg-[#F3EFEA]"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Search & Sort */}
        <div className="flex flex-1 items-center gap-2 lg:max-w-md">
          <div className="relative flex-1">
            <Search size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8C827A]" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="جستجوی محصول…"
              className="w-full rounded-full border border-[#E7E3DC] bg-[#FAF8F5] pr-10 pl-4 py-2 text-xs text-[#1C1816] outline-hidden focus:border-[#8E111E] focus:bg-white"
            />
          </div>
          <div className="relative">
            <SlidersHorizontal size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#8C827A]" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="appearance-none rounded-full border border-[#E7E3DC] bg-[#FAF8F5] pr-8 pl-6 py-2 text-xs text-[#1C1816] outline-hidden focus:border-[#8E111E]"
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

      {/* 3. Products Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} mode={mode} phone={phone} />
          ))}
        </div>
      ) : (
        <div className="rounded-[2.5rem] border border-[#E7E3DC] bg-white p-12 text-center text-xs text-[#78716C] space-y-3">
          <PackageSearch size={36} className="mx-auto text-[#8C827A]" />
          <p className="font-bold text-[#1C1816]">محصولی با این مشخصات یافت نشد.</p>
          <button
            onClick={() => {
              setSelectedCat("all");
              setQ("");
            }}
            className="text-[#8E111E] underline font-bold"
          >
            پاک کردن فیلترها
          </button>
        </div>
      )}
    </div>
  );
}
