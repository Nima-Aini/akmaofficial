"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toFa } from "@/lib/format";

const FALLBACK = "/images/products/foam-bottle.png";

export function ProductGallery({ images, productName, badge }: { images: string[]; productName: string; badge?: string }) {
  const validImages = useMemo(() => images.filter((image): image is string => typeof image === "string" && image.trim().length > 0), [images]);
  const gallery = validImages.length ? validImages : [FALLBACK];
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selected = gallery[selectedIndex] ?? gallery[0];

  function move(delta: number) {
    setSelectedIndex((current) => (current + delta + gallery.length) % gallery.length);
  }

  return (
    <div className="card overflow-hidden !rounded-[2rem] bg-card">
      {badge && <span className="absolute top-5 right-5 z-10 rounded-full bg-gradient-to-l from-accent2 to-accent px-4 py-2 text-xs font-extrabold text-on-accent shadow-lg shadow-accent/25">{badge}</span>}
      <div className="relative flex aspect-square w-full items-center justify-center bg-surface/30 p-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={selected}
          src={selected}
          alt={`${productName} — تصویر ${toFa(selectedIndex + 1)}`}
          className="size-full object-contain"
          onError={(event) => { if (!event.currentTarget.src.endsWith(FALLBACK)) event.currentTarget.src = FALLBACK; }}
        />
        {gallery.length > 1 && (
          <>
            <button type="button" onClick={() => move(-1)} className="absolute right-3 grid size-10 place-items-center rounded-full border border-line bg-card/90 text-ink shadow-lg focus-visible:outline-2 focus-visible:outline-accent" aria-label="تصویر قبلی"><ChevronRight size={18} /></button>
            <button type="button" onClick={() => move(1)} className="absolute left-3 grid size-10 place-items-center rounded-full border border-line bg-card/90 text-ink shadow-lg focus-visible:outline-2 focus-visible:outline-accent" aria-label="تصویر بعدی"><ChevronLeft size={18} /></button>
          </>
        )}
      </div>
      {gallery.length > 1 && (
        <div className="flex gap-3 overflow-x-auto border-t border-line bg-surface p-4" role="list" aria-label="تصاویر محصول">
          {gallery.map((image, index) => (
            <button
              type="button"
              key={`${image}-${index}`}
              onClick={() => setSelectedIndex(index)}
              className={`size-16 shrink-0 overflow-hidden rounded-xl border bg-card p-1 transition ${selectedIndex === index ? "border-accent ring-2 ring-accent/25" : "border-line hover:border-accent/60"}`}
              aria-label={`نمایش تصویر ${toFa(index + 1)} از ${productName}`}
              aria-pressed={selectedIndex === index}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image} alt="" className="size-full object-contain" loading="lazy" onError={(event) => { if (!event.currentTarget.src.endsWith(FALLBACK)) event.currentTarget.src = FALLBACK; }} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
