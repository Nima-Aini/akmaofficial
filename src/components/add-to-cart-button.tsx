"use client";

import { useState } from "react";
import { Check, Minus, Plus, ShoppingBag } from "lucide-react";
import { useCart } from "@/context/cart-context";
import { toFa } from "@/lib/format";
import type { ProductRow } from "@/db/schema";

export function AddToCartButton({
  product,
  size = "md",
  showQty = false,
}: {
  product: ProductRow;
  size?: "sm" | "md" | "lg";
  showQty?: boolean;
}) {
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    addItem(product, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const btnClasses = {
    sm: "h-9 px-3 text-xs",
    md: "h-11 px-4 text-xs font-bold",
    lg: "h-14 px-6 text-base font-extrabold",
  }[size];

  return (
    <div className="flex items-center gap-2">
      {showQty && (
        <div className="flex h-14 items-center gap-2 rounded-2xl border border-line bg-surface px-3">
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="grid size-8 place-items-center rounded-xl border border-line text-muted hover:text-ink"
            aria-label="کاهش تعداد"
          >
            <Minus size={14} />
          </button>
          <span className="min-w-8 text-center text-sm font-black text-ink">
            {toFa(qty)}
          </span>
          <button
            type="button"
            onClick={() => setQty((q) => q + 1)}
            className="grid size-8 place-items-center rounded-xl border border-line text-muted hover:text-ink"
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
        className={`btn flex-1 ${product.inStock ? "btn-primary" : "btn-ghost opacity-60"} ${btnClasses} transition-all`}
      >
        {added ? (
          <>
            <Check size={16} className="text-emerald-300" />
            افزوده شد!
          </>
        ) : product.inStock ? (
          <>
            <ShoppingBag size={16} />
            افزودن به سبد خرید
          </>
        ) : (
          "ناموجود"
        )}
      </button>
    </div>
  );
}
