import type { ProductRow } from "@/db/schema";
import { getProductImages } from "./product-media";
import { calculateProductPricing } from "./pricing";

const origin = "https://akmaofficial.ir";

export function retailProductListing(product: ProductRow) {
  if (!product.active || !product.isRetail) return null;
  const price = calculateProductPricing(product, 1, "retail").unitPrice;
  const hasImage = (product.retailImages?.length || product.images?.length);
  const imagePath = hasImage ? getProductImages(product, "retail")[0] : "";
  if (!Number.isSafeInteger(price) || price <= 0 || !imagePath) return null;
  const image = new URL(imagePath, origin);
  if (image.protocol !== "https:") return null;
  const url = `${origin}/products/${encodeURIComponent(product.slug)}?mode=retail`;
  const oldPrice = product.retailOldPrice && product.retailOldPrice > price ? product.retailOldPrice : null;
  return {
    // Preserve the already published Torob ID to avoid reindexing existing SKUs.
    id: String(product.id), name: product.name, image: image.href, url,
    price, oldPrice, available: Boolean(product.inStock),
  };
}
