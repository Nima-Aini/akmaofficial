"use client";

import Link from "next/link";
import { ShoppingCart, Eye, PackageCheck } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { useCart } from "@/context/cart-context";
import { getProductPricePresentation } from "@/lib/pricing";
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
  "relative rounded-xl border border-white/25 bg-black/25 p-3 text-white shadow-lg backdrop-blur-md supports-[not_(backdrop-filter:blur(1px))]:bg-black/65 md:rounded-2xl md:p-4";
export const PRODUCT_CARD_LINK_CLASS =
  "absolute inset-0 z-10 touch-manipulation rounded-2xl outline-none focus-visible:ring-4 focus-visible:ring-[#FFB0B7]/80 focus-visible:ring-inset";

export function getProductDetailHref(slug: string) {
  return `/products/${slug}`;
}

export function stopProductCardNavigation(event: { preventDefault: () => void; stopPropagation: () => void }) {
  event.preventDefault();
  event.stopPropagation();
}

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
  const pricing = getProductPricePresentation(
    product,
    mode === "wholesale" ? pack.minimumPackCount : 1,
    mode,
    { applyWholesaleTiers: false },
  );
  const productHref = getProductDetailHref(product.slug);

  const handleQuickAdd = (e: React.MouseEvent) => {
    stopProductCardNavigation(e);
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
      },
      mode === "wholesale" ? pack.minimumPackCount : 1,
      mode,
    );
  };

  return (
    <article className="group relative isolate flex min-h-[330px] cursor-pointer overflow-hidden rounded-2xl border border-white/50 bg-[#eee7dd] shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl focus-within:shadow-xl md:min-h-[390px]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={img} alt={product.name} loading="lazy" className="absolute inset-0 -z-20 size-full bg-[#eee7dd] object-contain p-2 transition-transform duration-700 group-hover:scale-105 md:object-cover md:p-0" />
      <div className="absolute inset-0 -z-10 bg-black/10" />
      <span
        aria-hidden="true"
        data-product-text-region={textRegionPosition}
        className={`pointer-events-none absolute z-0 backdrop-blur-[3px] ${getTextRegionBackdropClass(textRegionPosition, "bottom")}`}
      />
      {/* Top Badge: e.g. "پرفروش" or category */}
      <div className="pointer-events-none absolute inset-x-2.5 top-2.5 z-20 flex items-center justify-between gap-1 md:inset-x-4 md:top-4 md:gap-2">
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

      <Link href={productHref} className={PRODUCT_CARD_LINK_CLASS} aria-label={`مشاهده ${product.name}`} />

      {/* Product Info */}
      <div className={`pointer-events-none relative z-20 flex min-h-full w-full p-2.5 pt-14 md:p-4 md:pt-16 ${getTextRegionLayoutClass(textRegionPosition, "bottom")}`}>
        <div className={`${PRODUCT_GLASS_OVERLAY_CLASS} ${getTextRegionContentWidthClass(textRegionPosition, "bottom")}`}>
          <div>
            <h3 className="line-clamp-2 text-xs font-black leading-5 text-white transition-colors group-hover:text-[#FFD6DA]">
              {product.name}
            </h3>
            {product.subtitle && (
              <p className="mt-1 line-clamp-1 text-[11px] text-white/75">
                {product.subtitle}
              </p>
            )}
          </div>

          {/* Price & Action Button Bar */}
          <div className="mt-3 flex flex-wrap items-end justify-between gap-2 border-t border-white/15 pt-2.5 md:mt-4 md:flex-nowrap md:pt-3">
            <div>
              <span className="block font-mono text-sm font-black text-[#FFB0B7] md:text-base">
                {formatPrice(pricing.unitPrice)}
                <span className="mr-1 text-[11px] font-bold text-white/70">تومان</span>
              </span>
              <span className="mt-0.5 block text-[9px] font-bold text-white/70">{pricing.label}</span>
            </div>

            <div className="pointer-events-auto relative z-30 flex items-center gap-1.5">
              <Link
                href={productHref}
                className="grid size-8 place-items-center rounded-lg border border-white/25 bg-white/10 text-white backdrop-blur-md transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white md:size-9 md:rounded-xl"
                title="مشاهده جزئیات"
                aria-label={`مشاهده جزئیات ${product.name}`}
              >
                <Eye size={16} />
              </Link>
              <button
                type="button"
                onClick={handleQuickAdd}
                className="grid size-8 place-items-center rounded-lg bg-[#8E111E] text-white shadow-xs transition-all hover:bg-[#740D18] active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white md:size-9 md:rounded-xl"
                title="افزودن به سبد خرید"
                aria-label={`افزودن ${product.name} به سبد خرید`}
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
