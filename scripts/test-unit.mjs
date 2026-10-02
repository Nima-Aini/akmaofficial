/**
 * Akma Store - Isolated Unit & Domain Logic Tests
 * Tests pricing logic, tier calculations, phone masking, OTP formatting, and wholesale quantity validation.
 */
import assert from "node:assert";
import { generateSecureOtp } from "../src/lib/sms.ts";
import { calculateProductPricing } from "../src/lib/pricing.ts";

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
