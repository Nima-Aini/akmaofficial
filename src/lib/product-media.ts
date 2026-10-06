type ProductMedia = {
  images?: string[] | null;
  retailImages?: string[] | null;
  wholesaleImages?: string[] | null;
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
  const legacy = clean(product.images);
  const retail = clean(product.retailImages);
  const wholesale = clean(product.wholesaleImages);
  if (mode === "wholesale") {
    return wholesale.length ? wholesale : retail.length ? retail : legacy.length ? legacy : [FALLBACK];
  }
  return retail.length ? retail : legacy.length ? legacy : [FALLBACK];
}
