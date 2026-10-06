"use client";

import Link from "next/link";
import { ShoppingCart, Eye, PackageCheck } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { useCart } from "@/context/cart-context";
import { calculateProductPricing } from "@/lib/pricing";
import type { ProductRow } from "@/db/schema";
import { getProductImages } from "@/lib/product-media";
import { getWholesalePackConfig } from "@/lib/pricing";
import {
  getTextRegionBackdropClass,
  getTextRegionContentWidthClass,
  getTextRegionLayoutClass,
  normalizeTextRegionPosition,
} from "@/lib/text-region";

export const PRODUCT_GLASS_OVERLAY_CLASS =
  "relative rounded-2xl border border-white/25 bg-black/25 p-4 text-white shadow-lg backdrop-blur-md supports-[not_(backdrop-filter:blur(1px))]:bg-black/65";

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
  const img = getProductImages(product, mode)[0];
  const pack = getWholesalePackConfig(product);
  const textRegionPosition = normalizeTextRegionPosition(product.cardTextRegionPosition, "bottom");

  // Calculate pricing based on current active mode
  const pricing = calculateProductPricing(product, mode === "wholesale" ? pack.minimumPackCount : 1, mode);
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
        retailUnitLabel: product.retailUnitLabel,
        wholesalePackSize: product.wholesalePackSize,
        wholesalePackLabel: product.wholesalePackLabel,
        wholesaleMinPackQty: product.wholesaleMinPackQty,
        wholesaleMinQty: product.wholesaleMinQty,
        retailImages: product.retailImages,
        wholesaleImages: product.wholesaleImages,
        unitPrice: product.unitPrice,
      },
      mode === "wholesale" ? pack.minimumPackCount : 1,
      mode,
    );
  };

  return (
    <article className="group relative isolate flex min-h-[390px] overflow-hidden rounded-2xl border border-white/50 bg-[#eee7dd] shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={img} alt={product.name} loading="lazy" className="absolute inset-0 -z-20 size-full object-cover transition-transform duration-700 group-hover:scale-105" />
      <div className="absolute inset-0 -z-10 bg-black/10" />
      <span
        aria-hidden="true"
        data-product-text-region={textRegionPosition}
        className={`pointer-events-none absolute z-0 backdrop-blur-[3px] ${getTextRegionBackdropClass(textRegionPosition, "bottom")}`}
      />
      {/* Top Badge: e.g. "پرفروش" or category */}
      <div className="absolute inset-x-4 top-4 z-30 flex items-center justify-between gap-2">
        {product.badge ? (
          <span className="rounded-full bg-[#8E111E] px-2.5 py-0.5 text-[10px] font-black text-white shadow-xs">
            {product.badge}
          </span>
        ) : (
          <span className="rounded-full bg-black/40 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-sm">
            {product.categoryLabel}
          </span>
        )}

        {mode === "wholesale" ? (
          <span className="rounded-full border border-white/25 bg-black/30 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-md">
            {pack.packLabel} ({pack.minimumPackCount}+)
          </span>
        ) : (
          <span className="flex items-center gap-1 rounded-full border border-white/25 bg-black/30 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-md">
            <PackageCheck size={12} /> خرید تکی
          </span>
        )}
      </div>

      <Link href={`/products/${product.slug}`} className="absolute inset-0 z-10" aria-label={`مشاهده ${product.name}`} />

      {/* Product Info */}
      <div className={`relative z-20 flex min-h-full w-full p-4 pt-16 ${getTextRegionLayoutClass(textRegionPosition, "bottom")}`}>
        <div className={`${PRODUCT_GLASS_OVERLAY_CLASS} ${getTextRegionContentWidthClass(textRegionPosition, "bottom")}`}>
          <div>
            <Link href={`/products/${product.slug}`}>
              <h3 className="line-clamp-2 text-xs font-black leading-5 text-white transition-colors group-hover:text-[#FFD6DA]">
                {product.name}
              </h3>
            </Link>
            {product.subtitle && (
              <p className="mt-1 line-clamp-1 text-[11px] text-white/75">
                {product.subtitle}
              </p>
            )}
          </div>

          {/* Price & Action Button Bar */}
          <div className="mt-4 flex items-center justify-between border-t border-white/15 pt-3">
            <div>
              <span className="block font-mono text-base font-black text-[#FFB0B7]">
                {formatPrice(displayPrice)}
                <span className="mr-1 text-[11px] font-bold text-white/70">تومان</span>
              </span>
              {pricing.tierLabel && (
                <span className="mt-0.5 block text-[9px] font-bold text-white/70">
                  {pricing.tierLabel}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <Link
                href={`/products/${product.slug}`}
                className="relative z-30 grid size-9 place-items-center rounded-xl border border-white/25 bg-white/10 text-white backdrop-blur-md transition-colors hover:bg-white/20"
                title="مشاهده جزئیات"
              >
                <Eye size={16} />
              </Link>
              <button
                type="button"
                onClick={handleQuickAdd}
                className="relative z-30 grid size-9 place-items-center rounded-xl bg-[#8E111E] text-white shadow-xs transition-all hover:bg-[#740D18] active:scale-95"
                title="افزودن به سبد خرید"
              >
                <ShoppingCart size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
