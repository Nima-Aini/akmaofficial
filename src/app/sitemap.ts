import type { MetadataRoute } from "next";
import { getActiveProducts } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = (process.env.SITE_URL ?? "https://akmaofficial.ir").replace(/\/$/, "");
  const products = await getActiveProducts();
  const staticPages = ["", "/products", "/contact", "/tracking"];

  return [
    ...staticPages.map((path) => ({
      url: `${siteUrl}${path}`,
      lastModified: new Date(),
      changeFrequency: path === "" ? ("daily" as const) : ("weekly" as const),
      priority: path === "" ? 1 : 0.8,
    })),
    ...products.map((product) => ({
      url: `${siteUrl}/products/${encodeURIComponent(product.slug)}`,
      lastModified: product.createdAt,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })),
  ];
}
