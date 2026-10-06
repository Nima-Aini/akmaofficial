export const TEXT_REGION_POSITIONS = ["right", "left", "bottom", "center"] as const;

export type TextRegionPosition = (typeof TEXT_REGION_POSITIONS)[number];

export const TEXT_REGION_LABELS: Record<TextRegionPosition, string> = {
  right: "سمت راست",
  left: "سمت چپ",
  bottom: "پایین",
  center: "وسط",
};

export function normalizeTextRegionPosition(
  value: unknown,
  fallback: TextRegionPosition = "right",
): TextRegionPosition {
  return typeof value === "string" && TEXT_REGION_POSITIONS.includes(value as TextRegionPosition)
    ? (value as TextRegionPosition)
    : fallback;
}

export const TEXT_REGION_BACKDROP_CLASSES: Record<TextRegionPosition, string> = {
  right:
    "inset-y-0 right-0 w-full sm:w-[62%] bg-gradient-to-l from-black/75 via-black/48 to-transparent [mask-image:linear-gradient(to_left,black_0%,black_72%,transparent_100%)]",
  left:
    "inset-y-0 left-0 w-full sm:w-[62%] bg-gradient-to-r from-black/75 via-black/48 to-transparent [mask-image:linear-gradient(to_right,black_0%,black_72%,transparent_100%)]",
  bottom:
    "inset-x-0 bottom-0 h-[72%] bg-gradient-to-t from-black/82 via-black/48 to-transparent [mask-image:linear-gradient(to_top,black_0%,black_72%,transparent_100%)]",
  center:
    "inset-[8%] rounded-[2.5rem] bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.64),rgba(0,0,0,0.3)_58%,transparent_78%)] [mask-image:radial-gradient(ellipse_at_center,black_0%,black_64%,transparent_86%)]",
};

export const TEXT_REGION_LAYOUT_CLASSES: Record<TextRegionPosition, string> = {
  right: "items-center justify-end text-right",
  left: "items-center justify-start text-left",
  bottom: "items-end justify-center text-center",
  center: "items-center justify-center text-center",
};

export const TEXT_REGION_CONTENT_WIDTH_CLASSES: Record<TextRegionPosition, string> = {
  right: "w-full sm:w-[58%] sm:max-w-2xl",
  left: "w-full sm:w-[58%] sm:max-w-2xl",
  bottom: "w-full max-w-3xl",
  center: "w-full max-w-2xl",
};

export function getTextRegionBackdropClass(value: unknown, fallback: TextRegionPosition = "right") {
  return TEXT_REGION_BACKDROP_CLASSES[normalizeTextRegionPosition(value, fallback)];
}

export function getTextRegionLayoutClass(value: unknown, fallback: TextRegionPosition = "right") {
  return TEXT_REGION_LAYOUT_CLASSES[normalizeTextRegionPosition(value, fallback)];
}

export function getTextRegionContentWidthClass(value: unknown, fallback: TextRegionPosition = "right") {
  return TEXT_REGION_CONTENT_WIDTH_CLASSES[normalizeTextRegionPosition(value, fallback)];
}
