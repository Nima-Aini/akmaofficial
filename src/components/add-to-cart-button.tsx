"use client";

import { useState } from "react";
import { Check, Minus, Plus, ShoppingBag, Building2, User } from "lucide-react";
import { useCart } from "@/context/cart-context";
import { formatPrice, toFa } from "@/lib/format";
import { calculateProductPricing, getWholesalePackConfig } from "@/lib/pricing";
import type { ProductRow } from "@/db/schema";
import { useProductMode } from "@/context/product-mode-context";

export function AddToCartButton({
  product,
  size = "md",
  showQty = false,
  initialMode,
}: {
  product: ProductRow;
  size?: "sm" | "md" | "lg";
  showQty?: boolean;
  initialMode?: "retail" | "wholesale";
}) {
  const { addItem, cartMode } = useCart();
  const sharedMode = useProductMode();
  const initial = initialMode || sharedMode?.mode || cartMode || "retail";
  const pack = getWholesalePackConfig(product);
  const [localMode, setLocalMode] = useState<"retail" | "wholesale">(initial);
  const mode = sharedMode?.mode ?? localMode;
  const [qty, setQty] = useState(mode === "wholesale" ? pack.minimumPackCount : 1);
  const [added, setAdded] = useState(false);

  const pricing = calculateProductPricing(product, qty, mode);

  const handleAdd = () => {
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
      qty,
      mode,
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const handleSwitchMode = (newMode: "retail" | "wholesale") => {
    setLocalMode(newMode);
    sharedMode?.setMode(newMode);
    setQty(newMode === "wholesale" ? pack.minimumPackCount : 1);
  };

  const btnClasses = {
    sm: "h-9 px-3 text-xs",
    md: "h-11 px-4 text-xs font-bold",
    lg: "h-13 px-6 text-sm font-black",
  }[size];

  return (
    <div className="space-y-3">
      {/* Retail / Wholesale Mode Toggle on Product Detail */}
      {showQty && product.isRetail !== false && product.isWholesale !== false && (
        <div className="flex rounded-full bg-[#FAF8F5] p-1 border border-[#E7E3DC] text-xs font-bold">
          <button
            type="button"
            onClick={() => handleSwitchMode("retail")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-full transition-all ${
              mode === "retail"
                ? "bg-white text-[#8E111E] shadow-xs font-black"
                : "text-[#78716C]"
            }`}
          >
            <User size={13} />
            <span>خرید تکی</span>
          </button>
          <button
            type="button"
            onClick={() => handleSwitchMode("wholesale")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-full transition-all ${
              mode === "wholesale"
                ? "bg-[#8E111E] text-white shadow-xs font-black"
                : "text-[#78716C]"
            }`}
          >
            <Building2 size={13} />
            <span>خرید عمده ({pack.minimumPackCount}+ بسته)</span>
          </button>
        </div>
      )}

      {/* Tier Label info */}
      {showQty && pricing.tierLabel && (
        <p className="text-center text-xs font-bold text-[#8E111E]">
          {pricing.tierLabel}: {formatPrice(pricing.unitPrice)} تومان برای هر {pack.packLabel}
        </p>
      )}

      {showQty && mode === "wholesale" && (
        <div className="grid grid-cols-2 gap-2 rounded-2xl border border-[#8E111E]/15 bg-[#8E111E]/5 p-3 text-center text-xs">
          <p><span className="block text-[10px] text-[#78716C]">هر بسته</span><b>{toFa(pack.unitsPerPack)} عدد</b></p>
          <p><span className="block text-[10px] text-[#78716C]">مجموع کالا</span><b>{toFa(pricing.totalUnits ?? qty)} عدد</b></p>
        </div>
      )}

      <div className="flex items-center gap-2">
        {showQty && (
          <div className="flex h-13 items-center gap-2 rounded-full border border-[#E7E3DC] bg-[#FAF8F5] px-3">
            <button
              type="button"
              onClick={() => setQty((q) => Math.max(mode === "wholesale" ? pack.minimumPackCount : 1, q - 1))}
              className="grid size-8 place-items-center rounded-full border border-[#E7E3DC] bg-white text-[#4A423D] hover:text-[#1C1816]"
              aria-label="کاهش تعداد"
            >
              <Minus size={14} />
            </button>
            <span className="min-w-8 text-center text-sm font-black text-[#1C1816]">
              {toFa(qty)}
              <span className="mr-1 text-[10px] text-[#78716C]">{mode === "wholesale" ? "بسته" : (product.retailUnitLabel || "عدد")}</span>
            </span>
            <button
              type="button"
              onClick={() => setQty((q) => q + 1)}
              className="grid size-8 place-items-center rounded-full border border-[#E7E3DC] bg-white text-[#4A423D] hover:text-[#1C1816]"
              aria-label="افزایش تعداد"
            >
              <Plus size={14} />
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={handleAdd}
          disabled={!product.inStock}
          className={`flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-[#8E111E] hover:bg-[#720C17] text-white shadow-md shadow-[#8E111E]/20 ${btnClasses} transition-all active:scale-95 disabled:opacity-50`}
        >
          {added ? (
            <>
              <Check size={16} className="text-emerald-300" />
              به سبد خرید اضافه شد!
            </>
          ) : product.inStock ? (
            <>
              <ShoppingBag size={16} />
              {showQty
                ? `افزودن به سبد (${formatPrice(pricing.lineTotal)} تومان)`
                : "افزودن به سبد"}
            </>
          ) : (
            "ناموجود"
          )}
        </button>
      </div>
    </div>
  );
}
