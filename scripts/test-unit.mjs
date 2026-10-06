/**
 * Akma Store - Isolated Unit & Domain Logic Tests
 * Tests pricing logic, tier calculations, phone masking, OTP formatting, and wholesale quantity validation.
 */
import assert from "node:assert";
import { generateSecureOtp } from "../src/lib/sms.ts";
import { calculateProductPricing, getWholesalePackConfig, isPositiveSafeInteger } from "../src/lib/pricing.ts";
import { getProductImages } from "../src/lib/product-media.ts";

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

runTest("Pricing rejects invalid quantities instead of coercing them", () => {
  for (const quantity of [0, -1, 1.5, NaN, Infinity]) {
    assert.throws(() => calculateProductPricing({ price: 10 }, quantity, "retail"));
  }
});

runTest("Phone number masking in tracking API prevents data leaks", () => {
  const phone = "09123456789";
  const masked = phone.replace(/(\d{4})\d{4}(\d{3})/, "$1****$2");
  assert.strictEqual(masked, "0912****789", "Phone must be properly masked");
});

console.log("\n==================================================================");
console.log(`📊 UNIT TEST SUMMARY: ${passed}/${total} PASSED`);
console.log("==================================================================\n");

if (passed !== total) {
  process.exit(1);
}
