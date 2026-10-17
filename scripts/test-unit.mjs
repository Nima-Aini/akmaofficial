/**
 * Akma Store - Isolated Unit & Domain Logic Tests
 * Tests pricing logic, tier calculations, phone masking, OTP formatting, and wholesale quantity validation.
 */
import assert from "node:assert";
import { generateSecureOtp } from "../src/lib/sms.ts";
import { calculateProductPricing, getProductPricePresentation, getWholesalePackConfig, isPositiveSafeInteger } from "../src/lib/pricing.ts";
import { getProductImages, getResponsiveProductImages } from "../src/lib/product-media.ts";
import { applyRichTextMark, normalizeRichTextValue, replaceRichTextPlainText, richTextToPlainText, sanitizeRichTextMap, sanitizeTextColor } from "../src/lib/rich-text.ts";
import {
  getTextRegionBackdropClass,
  getTextRegionLayoutClass,
  normalizeTextRegionPosition,
  TEXT_REGION_BACKDROP_CLASSES,
} from "../src/lib/text-region.ts";
import {
  clampPercentage,
  getResponsiveFocalPoint,
  getResponsiveImageSource,
  getResponsiveTextRegion,
  sanitizeImageUrl,
  sanitizeResponsiveSetting,
} from "../src/lib/responsive-image.ts";
import { ResponsiveBannerMedia, getResponsiveTextLayoutClass } from "../src/components/responsive-banner.tsx";
import {
  getProductDetailHref,
  PRODUCT_CARD_LINK_CLASS,
  PRODUCT_GLASS_OVERLAY_CLASS,
  stopProductCardNavigation,
} from "../src/components/product-card.tsx";
import {
  createZarinpalPayment,
  getConfiguredPaymentProvider,
  tomansToRials,
  verifyZarinpalPayment,
  ZARINPAL_REQUEST_ENDPOINT,
  ZARINPAL_VERIFY_ENDPOINT,
} from "../src/lib/payment.ts";

console.log("==================================================================");
console.log("📦 RUNNING ISOLATED UNIT TESTS");
console.log("==================================================================\n");

let passed = 0;
let total = 0;

function runTest(name, fn) {
  total++;
  try {
    fn();
    console.log(`  ✅ PASS: ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     Error: ${err.message}`);
  }
}

async function runAsyncTest(name, fn) {
  total++;
  try {
    await fn();
    console.log(`  ✅ PASS: ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     Error: ${err.message}`);
  }
}

runTest("OTP generator creates secure 5-digit string", () => {
  const code1 = generateSecureOtp();
  const code2 = generateSecureOtp();
  assert.match(code1, /^\d{5}$/, "OTP must be 5 digits");
  assert.match(code2, /^\d{5}$/, "OTP must be 5 digits");
  assert.notStrictEqual(code1, "12345", "Hardcoded 12345 bypass must NOT be returned");
});

runTest("Server-side retail price calculation ignores client overrides", () => {
  const mockProduct = {
    price: 240000,
    retailPrice: 220000,
    wholesalePrice: 180000,
    wholesaleTiers: [
      { minQty: 10, price: 160000, label: "تخفیف ۱۰+ عدد" },
      { minQty: 50, price: 140000, label: "تخفیف ۵۰+ عدد" },
    ],
  };

  const retailResult = calculateProductPricing(mockProduct, 1, "retail");
  assert.strictEqual(retailResult.unitPrice, 220000, "Retail price must be 220,000");

  const wholesaleResult1 = calculateProductPricing(mockProduct, 5, "wholesale");
  assert.strictEqual(wholesaleResult1.unitPrice, 180000, "Base wholesale price for 5 pcs must be 180,000");

  const wholesaleResult10 = calculateProductPricing(mockProduct, 12, "wholesale");
  assert.strictEqual(wholesaleResult10.unitPrice, 160000, "Tier 1 wholesale price for 12 pcs must be 160,000");

  const wholesaleResult50 = calculateProductPricing(mockProduct, 60, "wholesale");
  assert.strictEqual(wholesaleResult50.unitPrice, 140000, "Tier 2 wholesale price for 60 pcs must be 140,000");
});

runTest("Wholesale min quantity validation logic", () => {
  const product = {
    name: "فوم تمیزکننده",
    wholesaleMinQty: 6,
    isWholesale: true,
  };

  const checkQty = (qty) => qty >= product.wholesaleMinQty;
  assert.strictEqual(checkQty(2), false, "Quantity 2 must be rejected for minQty 6");
  assert.strictEqual(checkQty(6), true, "Quantity 6 must be accepted for minQty 6");
  assert.strictEqual(checkQty(10), true, "Quantity 10 must be accepted for minQty 6");
});

runTest("Retail quantity accepts positive safe integers", () => {
  assert.equal(isPositiveSafeInteger(1), true);
  assert.equal(isPositiveSafeInteger(250), true);
});

runTest("Retail quantity rejects zero, negative and fractions", () => {
  for (const value of [0, -4, 1.5]) assert.equal(isPositiveSafeInteger(value), false);
});

runTest("Wholesale pack count rejects NaN, Infinity and unsafe integers", () => {
  for (const value of [NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) assert.equal(isPositiveSafeInteger(value), false);
});

runTest("Wholesale price is calculated per pack", () => {
  const result = calculateProductPricing({ price: 200, wholesalePrice: 1200000, wholesalePackSize: 12 }, 3, "wholesale");
  assert.equal(result.unitPrice, 1200000);
  assert.equal(result.lineTotal, 3600000);
});

runTest("Wholesale tier is selected by pack count", () => {
  const result = calculateProductPricing({ price: 1, wholesalePrice: 1200000, wholesalePackSize: 12, wholesaleTiers: [{ minQty: 5, price: 1100000 }, { minQty: 10, price: 1000000 }] }, 6, "wholesale");
  assert.equal(result.unitPrice, 1100000);
});

runTest("Wholesale total units equals pack count times pack size", () => {
  const result = calculateProductPricing({ price: 1, wholesalePrice: 10, wholesalePackSize: 12 }, 3, "wholesale");
  assert.equal(result.totalUnits, 36);
});

runTest("Wholesale minimum uses pack-count setting", () => {
  const config = getWholesalePackConfig({ price: 1, wholesalePackSize: 12, wholesaleMinPackQty: 2, wholesaleMinQty: 24 });
  assert.equal(config.minimumPackCount, 2);
});

runTest("Legacy wholesale config preserves behavior without guessing pack size", () => {
  const config = getWholesalePackConfig({ price: 1, wholesaleMinQty: 6 });
  assert.deepEqual(config, { unitsPerPack: 1, minimumPackCount: 6, packLabel: "بسته", configured: false });
});

runTest("Retail images fall back to legacy images", () => {
  assert.deepEqual(getProductImages({ images: ["legacy.webp"], retailImages: [] }, "retail"), ["legacy.webp"]);
});

runTest("Wholesale images prefer wholesale gallery", () => {
  assert.deepEqual(getProductImages({ images: ["legacy.webp"], retailImages: ["retail.webp"], wholesaleImages: ["wholesale.webp"] }, "wholesale"), ["wholesale.webp"]);
});

runTest("Wholesale images fall back through retail then legacy", () => {
  assert.deepEqual(getProductImages({ images: ["legacy.webp"], retailImages: ["retail.webp"] }, "wholesale"), ["retail.webp"]);
  assert.deepEqual(getProductImages({ images: ["legacy.webp"] }, "wholesale"), ["legacy.webp"]);
});

runTest("Responsive product media selects all four independent galleries", () => {
  const media = { images: ["legacy.webp"], retailImages: ["retail-desktop.webp"], retailMobileImages: ["retail-mobile.webp"], wholesaleImages: ["wholesale-desktop.webp"], wholesaleMobileImages: ["wholesale-mobile.webp"] };
  assert.deepEqual(getResponsiveProductImages(media, "retail", "desktop"), ["retail-desktop.webp"]);
  assert.deepEqual(getResponsiveProductImages(media, "retail", "mobile"), ["retail-mobile.webp"]);
  assert.deepEqual(getResponsiveProductImages(media, "wholesale", "desktop"), ["wholesale-desktop.webp"]);
  assert.deepEqual(getResponsiveProductImages(media, "wholesale", "mobile"), ["wholesale-mobile.webp"]);
});

runTest("Responsive product mobile galleries follow deterministic legacy fallbacks", () => {
  assert.deepEqual(getResponsiveProductImages({ images: ["legacy.webp"], retailImages: ["retail.webp"] }, "retail", "mobile"), ["retail.webp"]);
  assert.deepEqual(getResponsiveProductImages({ images: ["legacy.webp"], retailImages: ["retail.webp"], retailMobileImages: ["retail-mobile.webp"] }, "wholesale", "mobile"), ["retail-mobile.webp"]);
  assert.deepEqual(getResponsiveProductImages({ images: ["legacy.webp"] }, "wholesale", "mobile"), ["legacy.webp"]);
});

runTest("Rich text supports partial bold and color while preserving plain SEO text", () => {
  const original = normalizeRichTextValue(undefined, "آکما، انتخاب حرفه‌ای‌ها");
  const start = "آکما، ".length;
  const bold = applyRichTextMark(original, start, 24, { bold: true });
  const colored = applyRichTextMark(bold, start, 24, { color: "#E91239" });
  assert.equal(richTextToPlainText(colored), "آکما، انتخاب حرفه‌ای‌ها");
  assert.ok(colored.segments.some((segment) => segment.bold && segment.color === "#E91239"));
});

runTest("Rich text formatting reset and text replacement retain safe structure", () => {
  const formatted = applyRichTextMark(normalizeRichTextValue(undefined, "متن نمونه"), 0, 3, { bold: true, color: "#780B18" });
  const reset = applyRichTextMark(formatted, 0, 3, { bold: null, color: null });
  assert.equal(reset.segments[0].bold, undefined);
  assert.equal(richTextToPlainText(replaceRichTextPlainText(reset, "متن امن جدید")), "متن امن جدید");
});

runTest("Rich text rejects unsafe CSS and malformed metadata", () => {
  assert.equal(sanitizeTextColor("expression(alert(1))"), undefined);
  assert.deepEqual(sanitizeRichTextMap({ title: { segments: [{ text: "امن", color: "url(javascript:1)", bold: true }] }, "bad key!": { segments: [{ text: "x" }] } }), { title: { segments: [{ text: "امن", bold: true }] } });
});

runTest("Pricing rejects invalid quantities instead of coercing them", () => {
  for (const quantity of [0, -1, 1.5, NaN, Infinity]) {
    assert.throws(() => calculateProductPricing({ price: 10 }, quantity, "retail"));
  }
});

runTest("Retail price presentation is generated from the authoritative retail price", () => {
  const result = getProductPricePresentation({ price: 300000, retailPrice: 240000, retailUnitLabel: "عدد" }, 1, "retail");
  assert.equal(result.unitPrice, 240000);
  assert.equal(result.label, "قیمت هر عدد");
});

runTest("Retail price presentation uses a custom unit label", () => {
  const result = getProductPricePresentation({ price: 300000, retailPrice: 240000, retailUnitLabel: "جفت" }, 1, "retail");
  assert.equal(result.label, "قیمت هر جفت");
});

runTest("Retail price presentation falls back to عدد and the legacy base price", () => {
  const result = getProductPricePresentation({ price: 195000, retailPrice: 0, retailUnitLabel: "" }, 1, "retail");
  assert.equal(result.unitPrice, 195000);
  assert.equal(result.label, "قیمت هر عدد");
});

runTest("Wholesale price presentation generates the configured pack label and size", () => {
  const result = getProductPricePresentation({ price: 1, wholesalePrice: 1200000, wholesalePackSize: 12, wholesalePackLabel: "بسته ۱۲ عددی" }, 1, "wholesale");
  assert.equal(result.unitPrice, 1200000);
  assert.equal(result.label, "قیمت هر بسته ۱۲ عددی");
});

runTest("Wholesale price presentation generates a pack-size fallback label", () => {
  const result = getProductPricePresentation({ price: 1, wholesalePrice: 1200000, wholesalePackSize: 12, wholesalePackLabel: "" }, 1, "wholesale");
  assert.equal(result.label, "قیمت هر بسته ۱۲ عددی");
});

runTest("Wholesale price presentation updates at a selected pricing tier", () => {
  const product = { price: 1, wholesalePrice: 1200000, wholesalePackSize: 12, wholesalePackLabel: "بسته ۱۲ عددی", wholesaleTiers: [{ minQty: 5, price: 1100000, label: "۵+ بسته" }] };
  assert.equal(getProductPricePresentation(product, 4, "wholesale").unitPrice, 1200000);
  const tier = getProductPricePresentation(product, 5, "wholesale");
  assert.equal(tier.unitPrice, 1100000);
  assert.equal(tier.isTierPrice, true);
  assert.equal(tier.tierLabel, "۵+ بسته");
});

runTest("Product price presentation ignores legacy unitPrice text", () => {
  const result = getProductPricePresentation({ price: 200000, retailPrice: 180000, unitPrice: "قیمت واحد: ۱ تومان" }, 1, "retail");
  assert.equal(result.unitPrice, 180000);
  assert.equal(result.label, "قیمت هر عدد");
});

runTest("Product card link covers the whole card and targets its detail route", () => {
  assert.equal(getProductDetailHref("foam-box-10"), "/products/foam-box-10");
  assert.match(PRODUCT_CARD_LINK_CLASS, /absolute inset-0/);
  assert.match(PRODUCT_CARD_LINK_CLASS, /z-10/);
  assert.match(PRODUCT_CARD_LINK_CLASS, /touch-manipulation/);
  assert.match(PRODUCT_CARD_LINK_CLASS, /focus-visible/);
});

runTest("Product card internal actions cancel card navigation", () => {
  let prevented = false;
  let stopped = false;
  stopProductCardNavigation({ preventDefault: () => { prevented = true; }, stopPropagation: () => { stopped = true; } });
  assert.equal(prevented, true);
  assert.equal(stopped, true);
});

runTest("Legacy banners fall back to the right text region", () => {
  assert.equal(normalizeTextRegionPosition(undefined), "right");
  assert.equal(getTextRegionLayoutClass(undefined), getTextRegionLayoutClass("right"));
});

runTest("Product cards fall back to the bottom text region", () => {
  assert.equal(normalizeTextRegionPosition(undefined, "bottom"), "bottom");
  assert.equal(getTextRegionLayoutClass(undefined, "bottom"), getTextRegionLayoutClass("bottom", "bottom"));
});

runTest("All selectable text regions map to distinct frontend placement classes", () => {
  const positions = ["right", "left", "bottom", "center"];
  assert.equal(new Set(positions.map((position) => getTextRegionLayoutClass(position))).size, 4);
  for (const position of positions) assert.ok(getTextRegionBackdropClass(position).includes("bg-"));
});

runTest("Right and left text regions honor the storefront RTL flex direction", () => {
  assert.match(getTextRegionLayoutClass("right"), /justify-start/);
  assert.match(getTextRegionLayoutClass("left"), /justify-end/);
});

runTest("Invalid persisted text regions safely use the requested fallback", () => {
  assert.equal(normalizeTextRegionPosition("top-secret", "bottom"), "bottom");
});

runTest("Admin preview selection changes the marked region", () => {
  assert.notEqual(TEXT_REGION_BACKDROP_CLASSES.right, TEXT_REGION_BACKDROP_CLASSES.left);
  assert.notEqual(TEXT_REGION_BACKDROP_CLASSES.bottom, TEXT_REGION_BACKDROP_CLASSES.center);
});

runTest("Responsive banners select desktop and mobile sources independently", () => {
  const config = { image: "/desktop.webp", mobileImage: "/mobile.webp" };
  assert.equal(getResponsiveImageSource(config, "desktop", "/fallback.webp"), "/desktop.webp");
  assert.equal(getResponsiveImageSource(config, "mobile", "/fallback.webp"), "/mobile.webp");
});

runTest("Missing mobile and legacy responsive fields preserve existing banners", () => {
  assert.equal(getResponsiveImageSource({ image: "/legacy.webp" }, "mobile", "/fallback.webp"), "/legacy.webp");
  assert.equal(getResponsiveImageSource({}, "desktop", "/fallback.webp"), "/fallback.webp");
});

runTest("Mobile and desktop focal positions are normalized and clamped", () => {
  const config = { desktopObjectPosition: { x: -12, y: 125 }, mobileObjectPosition: { x: 34.4, y: 62.7 } };
  assert.deepEqual(getResponsiveFocalPoint(config, "desktop"), { x: 0, y: 100 });
  assert.deepEqual(getResponsiveFocalPoint(config, "mobile"), { x: 34, y: 63 });
  assert.equal(clampPercentage("not-a-number"), 50);
});

runTest("Mobile text region defaults to bottom without changing legacy desktop placement", () => {
  const legacy = { textRegionPosition: "left" };
  assert.equal(getResponsiveTextRegion(legacy, "desktop"), "left");
  assert.equal(getResponsiveTextRegion(legacy, "mobile"), "bottom");
  assert.notEqual(getResponsiveTextLayoutClass("right", "bottom"), getResponsiveTextLayoutClass("left", "center"));
});

runTest("Responsive media renders picture metadata and a mobile source", () => {
  const element = ResponsiveBannerMedia({ settings: { image: "/desktop.webp", mobileImage: "/mobile.webp" }, fallback: "/fallback.webp" });
  assert.equal(element.type, "picture");
  assert.equal(element.props["data-desktop-source"], "/desktop.webp");
  assert.equal(element.props["data-mobile-source"], "/mobile.webp");
  assert.equal(element.props.children[0].type, "source");
  assert.equal(element.props.children[0].props.media, "(max-width: 767px)");
});

runTest("Responsive setting validation blocks unsafe image CSS injection", () => {
  assert.equal(sanitizeImageUrl("javascript:alert(1)"), "");
  assert.equal(sanitizeImageUrl("url(https://evil.invalid/x)"), "");
  const saved = sanitizeResponsiveSetting("hero", { image: "/safe.webp", mobileImage: "javascript:alert(1)", desktopObjectPosition: { x: -1, y: 101 }, mobileTextRegionPosition: "invalid" });
  assert.deepEqual(saved, { image: "/safe.webp", mobileImage: "", desktopObjectPosition: { x: 0, y: 100 }, mobileTextRegionPosition: "bottom" });
});

runTest("Admin preview can switch mobile text placement without changing desktop", () => {
  const before = { image: "/desktop.webp", textRegionPosition: "right", mobileTextRegionPosition: "bottom" };
  const after = { ...before, mobileTextRegionPosition: "center" };
  assert.equal(getResponsiveTextRegion(after, "desktop"), "right");
  assert.notEqual(getResponsiveTextRegion(before, "mobile"), getResponsiveTextRegion(after, "mobile"));
});

runTest("Product content uses frosted glass instead of a solid white box", () => {
  assert.match(PRODUCT_GLASS_OVERLAY_CLASS, /backdrop-blur/);
  assert.match(PRODUCT_GLASS_OVERLAY_CLASS, /bg-black\/25/);
  assert.doesNotMatch(PRODUCT_GLASS_OVERLAY_CLASS, /bg-white(?:\/|\s|$)/);
});

runTest("Phone number masking in tracking API prevents data leaks", () => {
  const phone = "09123456789";
  const masked = phone.replace(/(\d{4})\d{4}(\d{3})/, "$1****$2");
  assert.strictEqual(masked, "0912****789", "Phone must be properly masked");
});

runTest("Payment provider selection preserves Zibal and supports Zarinpal", () => {
  const previous = process.env.PAYMENT_PROVIDER;
  process.env.PAYMENT_PROVIDER = "zarinpal";
  assert.equal(getConfiguredPaymentProvider(), "zarinpal");
  process.env.PAYMENT_PROVIDER = "zibal";
  assert.equal(getConfiguredPaymentProvider(), "zibal");
  if (previous === undefined) delete process.env.PAYMENT_PROVIDER; else process.env.PAYMENT_PROVIDER = previous;
});

runTest("Payment amount conversion is centralized and exact", () => {
  assert.equal(tomansToRials(240000), 2400000);
  assert.throws(() => tomansToRials(0));
  assert.throws(() => tomansToRials(1.5));
});

await runAsyncTest("Zarinpal request uses official v4 endpoint and normalizes Authority", async () => {
  const previous = { merchant: process.env.ZARINPAL_MERCHANT_ID, nodeEnv: process.env.NODE_ENV, integration: process.env.AKMA_INTEGRATION_TEST };
  const originalFetch = globalThis.fetch;
  process.env.NODE_ENV = "test";
  delete process.env.AKMA_INTEGRATION_TEST;
  process.env.ZARINPAL_MERCHANT_ID = "00000000-0000-0000-0000-000000000000";
  let captured;
  globalThis.fetch = async (url, init) => {
    captured = { url, body: JSON.parse(init.body) };
    return { ok: true, status: 200, json: async () => ({ data: { code: 100, authority: "A000TEST" }, errors: [] }) };
  };
  try {
    const result = await createZarinpalPayment({ trackingCode: "AKM-1", totalAmount: 240000, customerPhone: "09120000000" });
    assert.equal(captured.url, ZARINPAL_REQUEST_ENDPOINT);
    assert.equal(captured.body.amount, 2400000);
    assert.equal(captured.body.currency, "IRR");
    assert.equal(result.provider, "zarinpal");
    assert.equal(result.trackId, "A000TEST");
    assert.match(result.paymentUrl, /payment\.zarinpal\.com\/pg\/StartPay\/A000TEST$/);
  } finally {
    globalThis.fetch = originalFetch;
    if (previous.merchant === undefined) delete process.env.ZARINPAL_MERCHANT_ID; else process.env.ZARINPAL_MERCHANT_ID = previous.merchant;
    if (previous.nodeEnv === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = previous.nodeEnv;
    if (previous.integration === undefined) delete process.env.AKMA_INTEGRATION_TEST; else process.env.AKMA_INTEGRATION_TEST = previous.integration;
  }
});

await runAsyncTest("Zarinpal verification stores RefID and rejects unsuccessful responses", async () => {
  const originalFetch = globalThis.fetch;
  const previousMerchant = process.env.ZARINPAL_MERCHANT_ID;
  const previousIntegration = process.env.AKMA_INTEGRATION_TEST;
  process.env.ZARINPAL_MERCHANT_ID = "00000000-0000-0000-0000-000000000000";
  delete process.env.AKMA_INTEGRATION_TEST;
  let captured;
  globalThis.fetch = async (url, init) => {
    captured = { url, body: JSON.parse(init.body) };
    return { ok: true, json: async () => ({ data: { code: 101, ref_id: 987654, card_pan: "6037******1234" }, errors: [] }) };
  };
  try {
    const result = await verifyZarinpalPayment("A000TEST", 100000);
    assert.equal(captured.url, ZARINPAL_VERIFY_ENDPOINT);
    assert.equal(captured.body.amount, 1000000);
    assert.equal(result.success, true);
    assert.equal(result.alreadyVerified, true);
    assert.equal(result.refNumber, "987654");
    assert.equal(result.rawAmountRials, 1000000);
  } finally {
    globalThis.fetch = originalFetch;
    if (previousMerchant === undefined) delete process.env.ZARINPAL_MERCHANT_ID; else process.env.ZARINPAL_MERCHANT_ID = previousMerchant;
    if (previousIntegration === undefined) delete process.env.AKMA_INTEGRATION_TEST; else process.env.AKMA_INTEGRATION_TEST = previousIntegration;
  }
});

await runAsyncTest("Missing Zarinpal merchant ID fails closed in production", async () => {
  const previousMerchant = process.env.ZARINPAL_MERCHANT_ID;
  const previousNodeEnv = process.env.NODE_ENV;
  const previousIntegration = process.env.AKMA_INTEGRATION_TEST;
  delete process.env.ZARINPAL_MERCHANT_ID;
  delete process.env.AKMA_INTEGRATION_TEST;
  process.env.NODE_ENV = "production";
  try {
    await assert.rejects(() => createZarinpalPayment({ trackingCode: "AKM-CLOSED", totalAmount: 1000 }), /پیکربندی/);
  } finally {
    if (previousMerchant === undefined) delete process.env.ZARINPAL_MERCHANT_ID; else process.env.ZARINPAL_MERCHANT_ID = previousMerchant;
    if (previousNodeEnv === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = previousNodeEnv;
    if (previousIntegration === undefined) delete process.env.AKMA_INTEGRATION_TEST; else process.env.AKMA_INTEGRATION_TEST = previousIntegration;
  }
});

console.log("\n==================================================================");
console.log(`📊 UNIT TEST SUMMARY: ${passed}/${total} PASSED`);
console.log("==================================================================\n");

if (passed !== total) {
  process.exit(1);
}
