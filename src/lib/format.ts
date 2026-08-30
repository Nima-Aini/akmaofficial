const faDigits = "۰۱۲۳۴۵۶۷۸۹";

export function toFa(input: string | number): string {
  return String(input).replace(/[0-9]/g, (d) => faDigits[Number(d)]);
}

export function toEnDigits(input: string | number): string {
  return String(input ?? "")
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
}

const priceFmt = new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 0 });

export function formatPrice(n: number | null | undefined): string {
  if (n === null || n === undefined || isNaN(Number(n))) return "۰";
  return priceFmt.format(Number(n));
}

export function normalizePhone(p: string): string {
  const en = toEnDigits(p);
  return en.replace(/[^\d+]/g, "");
}

export function telHref(p: string): string {
  return `tel:${normalizePhone(p)}`;
}

