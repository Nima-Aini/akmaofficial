export type WholesaleTierItem = {
  minQty: number;
  price: number;
  label?: string;
};

export type PriceableProduct = {
  price: number;
  retailPrice?: number | null;
  wholesalePrice?: number | null;
  wholesaleTiers?: WholesaleTierItem[] | null;
};

export function calculateProductPricing(
  product: PriceableProduct,
  quantity: number,
  mode: "retail" | "wholesale" = "retail",
) {
  const qty = Math.max(1, quantity);
  if (mode === "wholesale") {
    const tiers = Array.isArray(product.wholesaleTiers)
      ? [...product.wholesaleTiers].sort((a, b) => b.minQty - a.minQty)
      : [];
    const matchedTier = tiers.find((t) => qty >= t.minQty);
    if (matchedTier) {
      return {
        unitPrice: matchedTier.price,
        tierLabel: matchedTier.label || `تخفیف تیراژ (${matchedTier.minQty}+ عدد)`,
      };
    }
    const baseWholesale =
      product.wholesalePrice && product.wholesalePrice > 0
        ? product.wholesalePrice
        : product.price;
    return {
      unitPrice: baseWholesale,
      tierLabel: "قیمت همکاری",
    };
  }

  const baseRetail =
    product.retailPrice && product.retailPrice > 0
      ? product.retailPrice
      : product.price;
  return {
    unitPrice: baseRetail,
    tierLabel: undefined,
  };
}
