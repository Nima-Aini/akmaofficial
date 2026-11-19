export function containsTelephoneOrderAction(value: unknown): boolean {
  const content = JSON.stringify(value ?? "");
  return /(?:سفارش|خرید)\s*تلفنی|tel\s*:/iu.test(content);
}

export function safePurchaseHref(value: string | undefined, fallback: string): string {
  return value && !/^(?:tel|sms|javascript):/i.test(value.trim()) ? value : fallback;
}
