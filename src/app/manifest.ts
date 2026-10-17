import type { MetadataRoute } from "next";
import { DEFAULT_BRANDING, DEFAULT_SITE, type BrandingSettings, type SiteSettings } from "@/lib/defaults";
import { getSettings } from "@/lib/store";

export const dynamic = "force-dynamic";

function imageMime(url: string) {
  const extension = url.split(/[?#]/, 1)[0].split(".").pop()?.toLowerCase();
  if (extension === "png") return "image/png";
  if (extension === "jpg" || extension === "jpeg") return "image/jpeg";
  if (extension === "avif") return "image/avif";
  if (extension === "gif") return "image/gif";
  return "image/webp";
}

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const settings = await getSettings();
  const site = { ...DEFAULT_SITE, ...(settings.site as Partial<SiteSettings>) };
  const branding = { ...DEFAULT_BRANDING, ...(settings.branding as Partial<BrandingSettings>) };
  return {
    name: site.name,
    short_name: site.latinName || site.name,
    description: site.seoDescription,
    start_url: "/",
    display: "standalone",
    background_color: "#FFFCF8",
    theme_color: "#780B18",
    icons: branding.appIcon ? [{ src: branding.appIcon, sizes: "512x512", type: imageMime(branding.appIcon) }] : [],
  };
}
