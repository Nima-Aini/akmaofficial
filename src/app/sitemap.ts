import type { MetadataRoute } from "next";
import { getActiveProducts } from "@/lib/store";
import { getPublishedBlogPosts } from "@/lib/content-store";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = "https://akmaofficial.ir";
  const [products, posts] = await Promise.all([getActiveProducts(), getPublishedBlogPosts()]);
  const staticPages = ["", "/products", "/blog", "/contact", "/tracking"];

  return [
    ...staticPages.map((path) => ({
      url: `${siteUrl}${path}`,
      lastModified: new Date(),
      changeFrequency: path === "" ? ("daily" as const) : ("weekly" as const),
      priority: path === "" ? 1 : 0.8,
    })),
    ...products.filter((product) => product.isRetail).map((product) => ({
      url: `${siteUrl}/products/${encodeURIComponent(product.slug)}?mode=retail`,
      lastModified: product.createdAt,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })),
    ...posts.map((post) => ({
      url: `${siteUrl}/blog/${encodeURIComponent(post.slug)}`,
      lastModified: post.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.75,
    })),
  ];
}
