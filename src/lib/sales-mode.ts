import type { ProductRow } from "@/db/schema";

export type SalesMode = "retail" | "wholesale";

export function getFeaturedProducts(products: ProductRow[], mode: SalesMode) {
  return products.filter((product) => product.active && (mode === "retail"
    ? product.isRetail && product.featuredRetail
    : product.isWholesale && product.featuredWholesale))
    .sort((a, b) => mode === "retail"
      ? a.retailFeaturedOrder - b.retailFeaturedOrder || a.id - b.id
      : a.wholesaleFeaturedOrder - b.wholesaleFeaturedOrder || a.id - b.id);
}
