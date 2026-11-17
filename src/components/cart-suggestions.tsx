"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from "react";
import { Plus, Sparkles } from "lucide-react";
import { useCart } from "@/context/cart-context";
import { formatPrice } from "@/lib/format";
import { RichText } from "@/components/rich-text";
import type { RichTextValue } from "@/lib/rich-text";

type SuggestedProduct = { id: number; name: string; images: string[]; price: number; suggestedPrice: number; suggestedImages: string[]; minimumPackCount: number; retailPrice: number; wholesalePrice: number; wholesaleTiers: { minQty: number; price: number; label?: string }[]; retailUnitLabel: string; wholesalePackSize: number | null; wholesalePackLabel: string; wholesaleMinPackQty: number | null; wholesaleMinQty: number; retailImages: string[]; wholesaleImages: string[]; retailMobileImages: string[]; wholesaleMobileImages: string[] };
type Suggestion = { id: number; message: string; messageRichText?: RichTextValue; suggestedProduct: SuggestedProduct };

export function CartSuggestions() {
  const { items, addItem, cartMode } = useCart();
  const [result, setResult] = useState<{ key: string; suggestions: Suggestion[] }>({ key: "", suggestions: [] });
  const ids = useMemo(() => items.map((item) => item.productId).sort((a, b) => a - b), [items]);
  const idsKey = `${cartMode}:${ids.join(",")}`;

  useEffect(() => {
    if (!items.length) return;
    const controller = new AbortController();
    fetch(`/api/cart-suggestions?mode=${cartMode}&productIds=${encodeURIComponent(idsKey.split(":")[1])}`, { signal: controller.signal })
      .then((res) => res.json()).then((data) => { if (data.ok) setResult({ key: idsKey, suggestions: data.suggestions }); })
      .catch((error) => { if (error instanceof Error && error.name !== "AbortError") setResult({ key: idsKey, suggestions: [] }); });
    return () => controller.abort();
  }, [idsKey, cartMode, items.length]);

  const visibleSuggestions = result.key === idsKey ? result.suggestions : [];
  const unique = visibleSuggestions.filter((suggestion, index, all) => all.findIndex((item) => item.suggestedProduct.id === suggestion.suggestedProduct.id) === index);
  if (!items.length || !unique.length) return null;

  return (
    <section className="mt-5 border-t border-line pt-5" aria-labelledby="cart-suggestions-title">
      <h3 id="cart-suggestions-title" className="flex items-center gap-2 text-xs font-black text-accent"><Sparkles size={15} /> پیشنهاد آکما</h3>
      <div className="mt-3 space-y-3">
        {unique.map((suggestion) => (
          <article key={suggestion.id} className="rounded-2xl border border-accent/25 bg-accent/5 p-3">
            {suggestion.message && <RichText as="p" className="mb-3 text-[11px] leading-5 text-muted" value={suggestion.messageRichText} fallback={suggestion.message} />}
            <div className="flex items-center gap-3">
              <div className="size-14 shrink-0 overflow-hidden rounded-xl border border-line bg-card p-1"><img src={suggestion.suggestedProduct.suggestedImages[0] || "/images/products/foam-bottle.png"} alt={suggestion.suggestedProduct.name} className="size-full object-contain" width="56" height="56" loading="lazy" /></div>
              <div className="min-w-0 flex-1"><p className="line-clamp-2 text-xs font-extrabold">{suggestion.suggestedProduct.name}</p><p className="mt-1 text-[11px] font-bold text-accent">{formatPrice(suggestion.suggestedProduct.suggestedPrice)} تومان {cartMode === "wholesale" ? "/ بسته" : ""}</p></div>
              <button type="button" onClick={() => addItem(suggestion.suggestedProduct, suggestion.suggestedProduct.minimumPackCount, cartMode)} className="btn btn-primary h-9 shrink-0 px-3 text-[10px]" aria-label={`افزودن ${suggestion.suggestedProduct.name} به سبد خرید`}><Plus size={13} /> افزودن</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
