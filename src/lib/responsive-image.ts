import { normalizeTextRegionPosition, type TextRegionPosition } from "./text-region";

export type ImageFocalPoint = { x: number; y: number };
export type ResponsiveViewport = "mobile" | "desktop";

export type ResponsiveImageSettings = {
  image: string;
  mobileImage?: string;
  desktopObjectPosition?: ImageFocalPoint;
  mobileObjectPosition?: ImageFocalPoint;
  textRegionPosition?: TextRegionPosition;
  mobileTextRegionPosition?: TextRegionPosition;
};

export const CENTER_FOCAL_POINT: ImageFocalPoint = { x: 50, y: 50 };

export function clampPercentage(value: unknown, fallback = 50): number {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(100, Math.max(0, Math.round(numeric)));
}

export function normalizeFocalPoint(value: unknown): ImageFocalPoint {
  if (!value || typeof value !== "object" || Array.isArray(value)) return { ...CENTER_FOCAL_POINT };
  const point = value as Record<string, unknown>;
  return { x: clampPercentage(point.x), y: clampPercentage(point.y) };
}

export function sanitizeImageUrl(value: unknown): string {
  if (typeof value !== "string") return "";
  const url = value.trim();
  if (!url || url.length > 2000) return "";
  if (url.startsWith("/") && !url.startsWith("//") && !url.includes("\\")) return url;
  if (/^https:\/\/[a-z0-9.-]+(?:[:][0-9]+)?(?:\/|$)/i.test(url)) return url;
  return "";
}

export function getResponsiveImageSource(
  settings: Partial<ResponsiveImageSettings> | null | undefined,
  viewport: ResponsiveViewport,
  fallback: string,
): string {
  const desktop = sanitizeImageUrl(settings?.image) || sanitizeImageUrl(fallback);
  if (viewport === "mobile") return sanitizeImageUrl(settings?.mobileImage) || desktop;
  return desktop;
}

export function getResponsiveFocalPoint(
  settings: Partial<ResponsiveImageSettings> | null | undefined,
  viewport: ResponsiveViewport,
): ImageFocalPoint {
  return normalizeFocalPoint(
    viewport === "mobile" ? settings?.mobileObjectPosition : settings?.desktopObjectPosition,
  );
}

export function getResponsiveTextRegion(
  settings: Partial<ResponsiveImageSettings> | null | undefined,
  viewport: ResponsiveViewport,
  desktopFallback: TextRegionPosition = "right",
  mobileFallback: TextRegionPosition = "bottom",
): TextRegionPosition {
  if (viewport === "mobile") {
    return normalizeTextRegionPosition(settings?.mobileTextRegionPosition, mobileFallback);
  }
  return normalizeTextRegionPosition(settings?.textRegionPosition, desktopFallback);
}

export function sanitizeResponsiveImageFields<T extends Record<string, unknown>>(value: T): T {
  const next: Record<string, unknown> = { ...value };
  next["image"] = sanitizeImageUrl(value["image"]);
  if ("mobileImage" in value) next["mobileImage"] = sanitizeImageUrl(value["mobileImage"]);
  if ("desktopObjectPosition" in value) next["desktopObjectPosition"] = normalizeFocalPoint(value["desktopObjectPosition"]);
  if ("mobileObjectPosition" in value) next["mobileObjectPosition"] = normalizeFocalPoint(value["mobileObjectPosition"]);
  if ("textRegionPosition" in value) next["textRegionPosition"] = normalizeTextRegionPosition(value["textRegionPosition"]);
  if ("mobileTextRegionPosition" in value) next["mobileTextRegionPosition"] = normalizeTextRegionPosition(value["mobileTextRegionPosition"], "bottom");
  return next as T;
}

export function sanitizeResponsiveSetting(key: string, value: unknown): unknown {
  if (key === "branding") {
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("ساختار برندینگ نامعتبر است");
    const raw = value as Record<string, unknown>;
    const imageFields = ["desktopHeaderLogo", "mobileHeaderLogo", "footerLogo", "darkBackgroundLogo", "lightBackgroundLogo", "favicon", "appIcon", "socialImage"] as const;
    const next: Record<string, unknown> = {};
    for (const field of imageFields) next[field] = sanitizeImageUrl(raw[field]);
    next.desktopLogoWidth = Math.min(240, Math.max(60, Number(raw.desktopLogoWidth) || 120));
    next.mobileLogoWidth = Math.min(180, Math.max(54, Number(raw.mobileLogoWidth) || 94));
    return next;
  }
  if (key === "banners" || key === "bottomBanners" || key === "categories") {
    if (!Array.isArray(value)) throw new Error("ساختار تنظیمات تصویر نامعتبر است");
    return value.map((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) throw new Error("ساختار تصویر نامعتبر است");
      return sanitizeResponsiveImageFields(item as Record<string, unknown>);
    });
  }
  if (key === "hero" || key === "wholesalePromo") {
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("ساختار تنظیمات تصویر نامعتبر است");
    return sanitizeResponsiveImageFields(value as Record<string, unknown>);
  }
  if (key === "dualCards") {
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("ساختار کارت‌ها نامعتبر است");
    const cards = value as Record<string, unknown>;
    const next = { ...cards };
    for (const mode of ["retail", "wholesale"] as const) {
      const card = cards[mode];
      if (card && typeof card === "object" && !Array.isArray(card)) {
        next[mode] = sanitizeResponsiveImageFields(card as Record<string, unknown>);
      }
    }
    return next;
  }
  return value;
}
