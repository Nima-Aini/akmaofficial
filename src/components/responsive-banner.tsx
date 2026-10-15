import type { CSSProperties, ReactNode } from "react";
import {
  getResponsiveFocalPoint,
  getResponsiveImageSource,
  getResponsiveTextRegion,
  type ResponsiveImageSettings,
  type ResponsiveViewport,
} from "@/lib/responsive-image";
import {
  getTextRegionBackdropClass,
  getTextRegionLayoutClass,
  type TextRegionPosition,
} from "@/lib/text-region";

type ResponsiveMediaMode = "responsive" | ResponsiveViewport;

export function ResponsiveBannerMedia({
  settings,
  fallback,
  alt = "",
  priority = false,
  mode = "responsive",
}: {
  settings: Partial<ResponsiveImageSettings>;
  fallback: string;
  alt?: string;
  priority?: boolean;
  mode?: ResponsiveMediaMode;
}) {
  const desktop = getResponsiveImageSource(settings, "desktop", fallback);
  const mobile = getResponsiveImageSource(settings, "mobile", fallback);
  const desktopPosition = getResponsiveFocalPoint(settings, "desktop");
  const mobilePosition = getResponsiveFocalPoint(settings, "mobile");
  const forcedSource = mode === "mobile" ? mobile : desktop;
  const forcedPosition = mode === "mobile" ? mobilePosition : desktopPosition;
  const style = mode === "responsive"
    ? ({
        "--banner-desktop-position": `${desktopPosition.x}% ${desktopPosition.y}%`,
        "--banner-mobile-position": `${mobilePosition.x}% ${mobilePosition.y}%`,
      } as CSSProperties)
    : { objectPosition: `${forcedPosition.x}% ${forcedPosition.y}%` };

  return (
    <picture
      data-responsive-banner-media="true"
      data-desktop-source={desktop}
      data-mobile-source={mobile}
    >
      {mode === "responsive" && mobile !== desktop ? <source media="(max-width: 767px)" srcSet={mobile} /> : null}
      <img
        src={mode === "responsive" ? desktop : forcedSource}
        alt={alt}
        fetchPriority={priority ? "high" : undefined}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        className={`absolute inset-0 -z-20 size-full object-cover ${mode === "responsive" ? "responsive-banner-media" : ""}`}
        style={style}
      />
    </picture>
  );
}

export function ResponsiveTextRegionBackdrop({
  settings,
  desktopFallback = "right",
  mobileFallback = "bottom",
  mode = "responsive",
}: {
  settings: Partial<ResponsiveImageSettings>;
  desktopFallback?: TextRegionPosition;
  mobileFallback?: TextRegionPosition;
  mode?: ResponsiveMediaMode;
}) {
  const desktop = getResponsiveTextRegion(settings, "desktop", desktopFallback, mobileFallback);
  const mobile = getResponsiveTextRegion(settings, "mobile", desktopFallback, mobileFallback);
  if (mode !== "responsive") {
    const position = mode === "mobile" ? mobile : desktop;
    return <span aria-hidden="true" data-text-region={position} className={`pointer-events-none absolute z-0 backdrop-blur-[3px] ${getTextRegionBackdropClass(position, mode === "mobile" ? mobileFallback : desktopFallback)}`} />;
  }
  return (
    <>
      <span aria-hidden="true" data-mobile-text-region={mobile} className={`pointer-events-none absolute z-0 backdrop-blur-[3px] md:hidden ${getTextRegionBackdropClass(mobile, mobileFallback)}`} />
      <span aria-hidden="true" data-desktop-text-region={desktop} className={`pointer-events-none absolute z-0 hidden backdrop-blur-[3px] md:block ${getTextRegionBackdropClass(desktop, desktopFallback)}`} />
    </>
  );
}

const RESPONSIVE_LAYOUT: Record<TextRegionPosition, Record<TextRegionPosition, string>> = {
  right: { right: "items-center justify-start text-right", left: "items-center justify-start text-right md:justify-end md:text-left", bottom: "items-center justify-start text-right md:items-end md:justify-center md:text-center", center: "items-center justify-start text-right md:justify-center md:text-center" },
  left: { right: "items-center justify-end text-left md:justify-start md:text-right", left: "items-center justify-end text-left", bottom: "items-center justify-end text-left md:items-end md:justify-center md:text-center", center: "items-center justify-end text-left md:justify-center md:text-center" },
  bottom: { right: "items-end justify-center text-center md:items-center md:justify-start md:text-right", left: "items-end justify-center text-center md:items-center md:justify-end md:text-left", bottom: "items-end justify-center text-center", center: "items-end justify-center text-center md:items-center" },
  center: { right: "items-center justify-center text-center md:justify-start md:text-right", left: "items-center justify-center text-center md:justify-end md:text-left", bottom: "items-center justify-center text-center md:items-end", center: "items-center justify-center text-center" },
};

const MOBILE_CONTENT_WIDTH: Record<TextRegionPosition, string> = {
  right: "w-[88%] max-w-sm",
  left: "w-[88%] max-w-sm",
  bottom: "w-full max-w-xl",
  center: "w-[92%] max-w-lg",
};

const DESKTOP_CONTENT_WIDTH: Record<TextRegionPosition, string> = {
  right: "md:w-[58%] md:max-w-2xl",
  left: "md:w-[58%] md:max-w-2xl",
  bottom: "md:w-full md:max-w-3xl",
  center: "md:w-full md:max-w-2xl",
};

export function getResponsiveTextLayoutClass(desktop: TextRegionPosition, mobile: TextRegionPosition) {
  return RESPONSIVE_LAYOUT[mobile][desktop];
}

export function ResponsiveBannerContent({
  settings,
  children,
  className = "",
  desktopFallback = "right",
  mobileFallback = "bottom",
}: {
  settings: Partial<ResponsiveImageSettings>;
  children: ReactNode;
  className?: string;
  desktopFallback?: TextRegionPosition;
  mobileFallback?: TextRegionPosition;
}) {
  const desktop = getResponsiveTextRegion(settings, "desktop", desktopFallback, mobileFallback);
  const mobile = getResponsiveTextRegion(settings, "mobile", desktopFallback, mobileFallback);
  return (
    <div className={`relative z-10 flex ${getResponsiveTextLayoutClass(desktop, mobile)} ${className}`}>
      <div className={`responsive-banner-content ${MOBILE_CONTENT_WIDTH[mobile]} ${DESKTOP_CONTENT_WIDTH[desktop]}`}>
        {children}
      </div>
    </div>
  );
}

export function getPreviewTextLayoutClass(position: TextRegionPosition) {
  return getTextRegionLayoutClass(position, position);
}
