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
  retailUnitLabel?: string | null;
  wholesalePackSize?: number | null;
  wholesalePackLabel?: string | null;
  wholesaleMinPackQty?: number | null;
  wholesaleMinQty?: number | null;
};

export function isPositiveSafeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

export function getWholesalePackConfig(product: PriceableProduct) {
  const configured = isPositiveSafeInteger(product.wholesalePackSize);
  const unitsPerPack: number = configured ? product.wholesalePackSize as number : 1;
  const minimum = isPositiveSafeInteger(product.wholesaleMinPackQty)
    ? product.wholesaleMinPackQty as number
    : isPositiveSafeInteger(product.wholesaleMinQty)
      ? product.wholesaleMinQty as number
      : 1;
  const packLabel = product.wholesalePackLabel?.trim() ||
    (configured ? `بسته ${unitsPerPack} عددی` : "بسته");
  return { unitsPerPack, minimumPackCount: minimum, packLabel, configured };
}

export function calculateProductPricing(
  product: PriceableProduct,
  quantity: number,
  mode: "retail" | "wholesale" = "retail",
) {
  if (!isPositiveSafeInteger(quantity)) {
    throw new Error("Quantity must be a positive safe integer.");
  }
  const qty = quantity;
  if (mode === "wholesale") {
    const tiers = Array.isArray(product.wholesaleTiers)
      ? [...product.wholesaleTiers].sort((a, b) => b.minQty - a.minQty)
      : [];
    const matchedTier = tiers.find((t) => qty >= t.minQty);
    if (matchedTier) {
      return {
        unitPrice: matchedTier.price,
        tierLabel: matchedTier.label || `قیمت پلکانی (${matchedTier.minQty}+ بسته)`,
        lineTotal: matchedTier.price * qty,
        totalUnits: qty * getWholesalePackConfig(product).unitsPerPack,
      };
    }
    const baseWholesale =
      product.wholesalePrice && product.wholesalePrice > 0
        ? product.wholesalePrice
        : product.price;
    return {
      unitPrice: baseWholesale,
      tierLabel: "قیمت همکاری هر بسته",
      lineTotal: baseWholesale * qty,
      totalUnits: qty * getWholesalePackConfig(product).unitsPerPack,
    };
  }

  const baseRetail =
    product.retailPrice && product.retailPrice > 0
      ? product.retailPrice
      : product.price;
  return {
    unitPrice: baseRetail,
    tierLabel: undefined,
    lineTotal: baseRetail * qty,
    totalUnits: qty,
  };
}
