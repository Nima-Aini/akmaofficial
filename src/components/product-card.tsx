"use client";

import Link from "next/link";
import { ShoppingCart, Eye, PackageCheck } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { useCart } from "@/context/cart-context";
import { calculateProductPricing } from "@/lib/pricing";
import type { ProductRow } from "@/db/schema";

export function ProductCard({
  product,
  mode = "retail",
}: {
  product: ProductRow;
  phone?: string;
  delay?: number;
  mode?: "retail" | "wholesale";
}) {
  const { addItem } = useCart();
  const img = product.images[0] ?? "/images/redesign/cat-foam.jpg";

  // Calculate pricing based on current active mode
  const pricing = calculateProductPricing(product, mode === "wholesale" ? (product.wholesaleMinQty || 6) : 1, mode);
  const displayPrice = pricing.unitPrice;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(
      {
        id: product.id,
        name: product.name,
        images: product.images,
        price: product.price,
        retailPrice: product.retailPrice,
        wholesalePrice: product.wholesalePrice,
        wholesaleTiers: product.wholesaleTiers,
        unitPrice: product.unitPrice,
      },
      mode === "wholesale" ? (product.wholesaleMinQty || 6) : 1,
      mode,
    );
  };

  return (
    <article className="group relative flex flex-col rounded-2xl border border-[#EBE7DF] bg-white p-4 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-[#8E111E]/40 hover:shadow-lg">
      {/* Top Badge: e.g. "پرفروش" or category */}
      <div className="flex items-center justify-between gap-2 mb-2">
        {product.badge ? (
          <span className="rounded-full bg-[#8E111E] px-2.5 py-0.5 text-[10px] font-black text-white shadow-xs">
            {product.badge}
          </span>
        ) : (
          <span className="text-[10px] font-bold text-[#8C827A]">
            {product.categoryLabel}
          </span>
        )}

        {mode === "wholesale" ? (
          <span className="text-[10px] font-bold text-[#8E111E] bg-[#8E111E]/10 px-2 py-0.5 rounded-md">
            عمده ({product.wholesaleMinQty || 6}+)
          </span>
        ) : (
          <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
            <PackageCheck size={12} /> خرید تکی
          </span>
        )}
      </div>

      {/* Product Image */}
      <Link
        href={`/products/${product.slug}`}
        className="relative block aspect-square w-full overflow-hidden rounded-xl bg-[#FAF8F5] p-3 transition-colors group-hover:bg-[#F5F2EB]"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={img}
          alt={product.name}
          loading="lazy"
          className="size-full object-contain transition-transform duration-500 ease-out group-hover:scale-108"
        />
      </Link>

      {/* Product Info */}
      <div className="flex grow flex-col justify-between pt-3">
        <div>
          <Link href={`/products/${product.slug}`}>
            <h3 className="line-clamp-2 text-xs font-black leading-5 text-[#2A2421] transition-colors group-hover:text-[#8E111E]">
              {product.name}
            </h3>
          </Link>
          {product.subtitle && (
            <p className="mt-1 line-clamp-1 text-[11px] text-[#8C827A]">
              {product.subtitle}
            </p>
          )}
        </div>

        {/* Price & Action Button Bar */}
        <div className="mt-4 flex items-center justify-between border-t border-[#F0ECE4] pt-3">
          <div>
            <span className="block font-mono text-base font-black text-[#8E111E]">
              {formatPrice(displayPrice)}
              <span className="mr-1 text-[11px] font-bold text-[#8C827A]">تومان</span>
            </span>
            {pricing.tierLabel && (
              <span className="block text-[9px] font-bold text-[#8C827A] mt-0.5">
                {pricing.tierLabel}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <Link
              href={`/products/${product.slug}`}
              className="grid size-9 place-items-center rounded-xl border border-[#E7E3DC] text-[#4A423D] hover:bg-[#FAF8F5] hover:text-[#8E111E] transition-colors"
              title="مشاهده جزئیات"
            >
              <Eye size={16} />
            </Link>
            <button
              type="button"
              onClick={handleQuickAdd}
              className="grid size-9 place-items-center rounded-xl bg-[#8E111E] text-white hover:bg-[#740D18] shadow-xs active:scale-95 transition-all"
              title="افزودن به سبد خرید"
            >
              <ShoppingCart size={16} />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
