const PUBLIC_APP_URL = "https://akmaofficial.ir";

export function paymentResultUrl(
  path: "/checkout" | "/checkout/result",
  params: Record<string, string>,
  configuredUrl = process.env.APP_URL,
  production = process.env.NODE_ENV === "production",
): string {
  const raw = configuredUrl?.trim() || PUBLIC_APP_URL;
  let base: URL;
  try {
    base = new URL(raw);
  } catch {
    throw new Error("Invalid public APP_URL for payment redirects");
  }
  if (base.protocol !== "https:" || base.username || base.password || base.pathname !== "/" ||
      base.search || base.hash || (production && (base.hostname !== "akmaofficial.ir" || base.port))) {
    throw new Error("Invalid public APP_URL for payment redirects");
  }
  const destination = new URL(path, base);
  for (const [key, value] of Object.entries(params)) destination.searchParams.set(key, value);
  return destination.toString();
}
