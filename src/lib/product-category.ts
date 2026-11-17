import { CATEGORIES } from "./defaults";

export type CategoryDefinition = { key: string; label: string };

/** The key is stable; the current CMS label is the sole presentation source. */
export function resolveProductCategoryLabel(key: string, categories?: CategoryDefinition[], legacyLabel = ""): string {
  const configured = Array.isArray(categories) ? categories.find((item) => item?.key === key) : undefined;
  const builtIn = CATEGORIES.find((item) => item.key === key && item.key !== "all");
  return configured?.label?.trim() || builtIn?.label || legacyLabel || `دسته‌بندی ناشناخته (${key})`;
}

export function isKnownProductCategory(key: string, categories?: CategoryDefinition[]): boolean {
  return Boolean((Array.isArray(categories) && categories.some((item) => item?.key === key)) ||
    CATEGORIES.some((item) => item.key === key && item.key !== "all"));
}
