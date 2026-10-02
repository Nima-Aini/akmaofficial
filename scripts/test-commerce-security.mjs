/**
 * Akma Store - Test Runner Entry Point
 * Executes unit tests and PostgreSQL integration tests.
 */
import { execSync } from "node:child_process";

console.log("==================================================================");
console.log("🚀 STARTING AKMA TEST SUITE EXECUTION");
console.log("==================================================================\n");

try {
  console.log("👉 Step 1: Running Isolated Unit Tests...");
  execSync("node --import tsx scripts/test-unit.mjs", { stdio: "inherit" });

  console.log("\n👉 Step 2: Running Genuine PostgreSQL Integration Tests...");
  execSync("node --import tsx scripts/test-pg-integration.mjs", { stdio: "inherit" });

  console.log("\n==================================================================");
  console.log("✅ ALL ENABLED TEST SUITES PASSED SUCCESSFULLY");
  console.log("==================================================================\n");
} catch (err) {
  console.error("\n❌ Test Suite Failed:", err.message);
  process.exit(1);
}
