"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toFa } from "@/lib/format";
import { useProductMode } from "@/context/product-mode-context";
import { getResponsiveProductImages } from "@/lib/product-media";
import { normalizeFocalPoint, type ImageFocalPoint } from "@/lib/responsive-image";

const FALLBACK = "/images/products/foam-bottle.png";

export function ProductGallery({ images, retailImages = [], wholesaleImages = [], retailMobileImages = [], wholesaleMobileImages = [], desktopObjectPosition, mobileObjectPosition, productName, badge }: { images: string[]; retailImages?: string[]; wholesaleImages?: string[]; retailMobileImages?: string[]; wholesaleMobileImages?: string[]; desktopObjectPosition?: ImageFocalPoint; mobileObjectPosition?: ImageFocalPoint; productName: string; badge?: string }) {
  const productMode = useProductMode();
  const mode = productMode?.mode ?? "retail";
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 767px)");
    const sync = () => setIsMobile(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);
  const media = useMemo(() => ({ images, retailImages, wholesaleImages, retailMobileImages, wholesaleMobileImages }), [images, retailImages, wholesaleImages, retailMobileImages, wholesaleMobileImages]);
  const desktopGallery = useMemo(() => getResponsiveProductImages(media, mode, "desktop"), [media, mode]);
  const mobileGallery = useMemo(() => getResponsiveProductImages(media, mode, "mobile"), [media, mode]);
  const modeImages = useMemo(() => getResponsiveProductImages(media, mode, isMobile ? "mobile" : "desktop"), [media, mode, isMobile]);
  const validImages = useMemo(() => modeImages.filter((image): image is string => typeof image === "string" && image.trim().length > 0), [modeImages]);
  const gallery = validImages.length ? validImages : [FALLBACK];
  const [selectedIndex, setSelectedIndex] = useState(0);
  const safeIndex = Math.min(selectedIndex, Math.max(0, gallery.length - 1));
  const selectedDesktop = desktopGallery[Math.min(safeIndex, desktopGallery.length - 1)] ?? desktopGallery[0] ?? FALLBACK;
  const selectedMobile = mobileGallery[Math.min(safeIndex, mobileGallery.length - 1)] ?? mobileGallery[0] ?? selectedDesktop;
  const focalPoint = normalizeFocalPoint(isMobile ? mobileObjectPosition : desktopObjectPosition);

  function move(delta: number) {
    setSelectedIndex((safeIndex + delta + gallery.length) % gallery.length);
  }

  return (
    <div className="card overflow-hidden !rounded-[2rem] bg-card">
      {badge && <span className="absolute top-5 right-5 z-10 rounded-full bg-gradient-to-l from-accent2 to-accent px-4 py-2 text-xs font-extrabold text-on-accent shadow-lg shadow-accent/25">{badge}</span>}
      <div className="relative flex aspect-square w-full items-center justify-center bg-surface/30 p-6">
        <picture key={`${mode}-${selectedDesktop}-${selectedMobile}`} className="block size-full" data-responsive-product-gallery="true" data-mobile-source={selectedMobile}>
          <source media="(max-width: 767px)" srcSet={selectedMobile} />
          <img
            src={selectedDesktop}
            alt={`${productName} — تصویر ${toFa(safeIndex + 1)}`}
            className="responsive-product-media size-full object-contain"
            style={{ "--product-desktop-position": `${desktopObjectPosition?.x ?? 50}% ${desktopObjectPosition?.y ?? 50}%`, "--product-mobile-position": `${mobileObjectPosition?.x ?? 50}% ${mobileObjectPosition?.y ?? 50}%`, objectPosition: `${focalPoint.x}% ${focalPoint.y}%` } as React.CSSProperties}
            onError={(event) => { if (!event.currentTarget.src.endsWith(FALLBACK)) event.currentTarget.src = FALLBACK; }}
          />
        </picture>
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
              className={`size-16 shrink-0 overflow-hidden rounded-xl border bg-card p-1 transition ${safeIndex === index ? "border-accent ring-2 ring-accent/25" : "border-line hover:border-accent/60"}`}
              aria-label={`نمایش تصویر ${toFa(index + 1)} از ${productName}`}
              aria-pressed={safeIndex === index}
            >
              <img src={image} alt="" className="size-full object-contain" loading="lazy" onError={(event) => { if (!event.currentTarget.src.endsWith(FALLBACK)) event.currentTarget.src = FALLBACK; }} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
