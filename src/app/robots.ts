import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.SITE_URL ?? "https://akmaofficial.ir";
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/akma-secret-admin", "/api/admin"],
      },
    ],
    sitemap: `${siteUrl.replace(/\/$/, "")}/sitemap.xml`,
    host: siteUrl,
  };
}
