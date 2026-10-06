"use client";

import Link from "next/link";
import { ShoppingCart, Eye, PackageCheck } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { useCart } from "@/context/cart-context";
import { calculateProductPricing } from "@/lib/pricing";
import type { ProductRow } from "@/db/schema";
import { getProductImages } from "@/lib/product-media";
import { getWholesalePackConfig } from "@/lib/pricing";

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
      <img src={img} alt="" loading="lazy" className="absolute inset-0 -z-20 size-full object-cover transition-transform duration-700 group-hover:scale-105" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/80 via-black/15 to-black/10" />
      <div className="flex w-full flex-col justify-between p-4">
      {/* Top Badge: e.g. "پرفروش" or category */}
      <div className="flex items-center justify-between gap-2 mb-2">
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
          <span className="rounded-full bg-white/85 px-2.5 py-1 text-[10px] font-bold text-[#8E111E] backdrop-blur-sm">
            {pack.packLabel} ({pack.minimumPackCount}+)
          </span>
        ) : (
          <span className="flex items-center gap-1 rounded-full bg-white/85 px-2.5 py-1 text-[10px] font-bold text-emerald-700 backdrop-blur-sm">
            <PackageCheck size={12} /> خرید تکی
          </span>
        )}
      </div>

      <Link href={`/products/${product.slug}`} className="absolute inset-0" aria-label={`مشاهده ${product.name}`} />

      {/* Product Info */}
      <div className="relative mt-auto rounded-2xl border border-white/35 bg-white/82 p-4 shadow-lg backdrop-blur-md">
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
        <div className="mt-4 flex items-center justify-between border-t border-black/10 pt-3">
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
              className="relative grid size-9 place-items-center rounded-xl border border-black/10 bg-white/60 text-[#4A423D] hover:bg-white hover:text-[#8E111E] transition-colors"
              title="مشاهده جزئیات"
            >
              <Eye size={16} />
            </Link>
            <button
              type="button"
              onClick={handleQuickAdd}
              className="relative grid size-9 place-items-center rounded-xl bg-[#8E111E] text-white hover:bg-[#740D18] shadow-xs active:scale-95 transition-all"
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
