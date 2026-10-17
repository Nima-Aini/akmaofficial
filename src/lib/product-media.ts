type ProductMedia = {
  images?: string[] | null;
  retailImages?: string[] | null;
  wholesaleImages?: string[] | null;
  retailMobileImages?: string[] | null;
  wholesaleMobileImages?: string[] | null;
};

const FALLBACK = "/images/products/foam-bottle.png";

function clean(images: string[] | null | undefined): string[] {
  return Array.isArray(images)
    ? images.filter((image): image is string => typeof image === "string" && image.trim().length > 0)
    : [];
}

export function getProductImages(
  product: ProductMedia,
  mode: "retail" | "wholesale",
): string[] {
  return getResponsiveProductImages(product, mode, "desktop");
}

export function getResponsiveProductImages(
  product: ProductMedia,
  mode: "retail" | "wholesale",
  viewport: "mobile" | "desktop",
): string[] {
  const legacy = clean(product.images);
  const retail = clean(product.retailImages);
  const wholesale = clean(product.wholesaleImages);
  const retailMobile = clean(product.retailMobileImages);
  const wholesaleMobile = clean(product.wholesaleMobileImages);
  if (viewport === "mobile") {
    if (mode === "wholesale") {
      return wholesaleMobile.length
        ? wholesaleMobile
        : wholesale.length
          ? wholesale
          : retailMobile.length
            ? retailMobile
            : retail.length
              ? retail
              : legacy.length
                ? legacy
                : [FALLBACK];
    }
    return retailMobile.length
      ? retailMobile
      : retail.length
        ? retail
        : legacy.length
          ? legacy
          : [FALLBACK];
  }
  if (mode === "wholesale") {
    return wholesale.length ? wholesale : retail.length ? retail : legacy.length ? legacy : [FALLBACK];
  }
  return retail.length ? retail : legacy.length ? legacy : [FALLBACK];
}

export function getResponsiveProductCoverSources(
  product: ProductMedia,
  mode: "retail" | "wholesale",
): { desktop: string; mobile: string } {
  return {
    desktop: getResponsiveProductImages(product, mode, "desktop")[0],
    mobile: getResponsiveProductImages(product, mode, "mobile")[0],
  };
}
