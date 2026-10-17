import { getSetting } from "@/lib/store";
import { DEFAULT_BRANDING, type BrandingSettings } from "@/lib/defaults";

export const dynamic = "force-dynamic";

const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="16" fill="#e8132c"/>
  <path d="M17 46 28 18h8l11 28h-8l-2-6H27l-2 6h-8Zm12-13h6l-3-9-3 9Z" fill="#fff"/>
</svg>`;

export async function GET(req: Request) {
  const branding = { ...DEFAULT_BRANDING, ...((await getSetting<Partial<BrandingSettings>>("branding")) ?? {}) };
  if (branding.favicon) return Response.redirect(new URL(branding.favicon, req.url), 307);
  return new Response(favicon, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}
