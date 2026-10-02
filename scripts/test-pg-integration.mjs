import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";

const TEST_DATABASE_NAME = "akma_test_db";
const ALLOWED_HOSTS = new Set(["127.0.0.1", "localhost", "::1"]);
const FORBIDDEN_MARKERS = ["akmaofficial", "production", "prod", "live"];

function validatedDatabaseUrl() {
  if (process.env.AKMA_INTEGRATION_TEST !== "1") throw new Error("AKMA_INTEGRATION_TEST=1 is required before any integration-test database operation.");
  const raw = process.env.TEST_DATABASE_URL;
  if (!raw) throw new Error("TEST_DATABASE_URL is required and integration tests never fall back to DATABASE_URL.");
  let url;
  try { url = new URL(raw); } catch { throw new Error("TEST_DATABASE_URL must be a valid PostgreSQL URL."); }
  if (!["postgres:", "postgresql:"].includes(url.protocol)) throw new Error("TEST_DATABASE_URL must use the postgres or postgresql protocol.");
  const host = url.hostname.toLowerCase();
  const database = decodeURIComponent(url.pathname.replace(/^\//, ""));
  if (!ALLOWED_HOSTS.has(host)) throw new Error(`Integration database host is not approved: ${host}`);
  if (FORBIDDEN_MARKERS.some((part) => host.includes(part) || database.toLowerCase().includes(part))) throw new Error("Known production host/database markers are forbidden in TEST_DATABASE_URL.");
  if (database !== TEST_DATABASE_NAME) throw new Error(`Disposable database must be named exactly ${TEST_DATABASE_NAME}.`);
  console.log("[isolation] validated disposable PostgreSQL target", { host, port: url.port || "5432", database, testMode: process.env.AKMA_INTEGRATION_TEST });
  process.env.DATABASE_URL = raw;
  process.env.AKMA_TEST_TRANSPORT = "mock";
  process.env.AKMA_TEST_OTP_CODE = "54321";
  process.env.ADMIN_SESSION_SECRET ||= "deterministic-ci-session-secret-not-for-production";
  delete process.env.AKMA_ALLOW_MEMORY_STORE;
  return raw;
}

const dbUrl = validatedDatabaseUrl();
const schema = await import("../src/db/schema.ts");
const { orders, paymentAttempts, customerUsers, customerOtps, adminUsers, settings, products } = schema;
const { atomicUpdateOrderPaymentRetry, processOrderPaymentVerification } = await import("../src/lib/payment.ts");
const { createCustomerToken, sendCustomerOtp } = await import("../src/lib/customer-auth.ts");
const { createSessionToken, hashPassword } = await import("../src/lib/auth.ts");
const { getAllProducts, saveSetting } = await import("../src/lib/store.ts");
const { pool: appPool } = await import("../src/db/index.ts");
const pool = new pg.Pool({ connectionString: dbUrl, max: 12 });
const db = drizzle(pool);
const port = Number(process.env.AKMA_TEST_SERVER_PORT || 3001);
const baseUrl = `http://127.0.0.1:${port}`;
let server;
let passed = 0;
let total = 0;

async function test(name, fn) {
  total += 1;
  try { await fn(); passed += 1; console.log(`  PASS ${name}`); }
  catch (error) { console.error(`  FAIL ${name}`); console.error(error); }
}
async function migrate() {
  const dir = path.resolve("migrations");
  for (const file of (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort()) await pool.query(await readFile(path.join(dir, file), "utf8"));
}
async function reset() {
  await pool.query("TRUNCATE TABLE payment_attempts, orders, customer_users, customer_otps, admin_users, cart_product_suggestions, blog_posts, settings, products RESTART IDENTITY CASCADE");
}
async function startServer() {
  server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "-p", String(port), "-H", "127.0.0.1"], {
    cwd: process.cwd(),
    env: { ...process.env, DATABASE_URL: dbUrl, AKMA_INTEGRATION_TEST: "1", AKMA_TEST_TRANSPORT: "mock", AKMA_TEST_OTP_CODE: "54321", APP_URL: baseUrl },
    stdio: ["ignore", "pipe", "pipe"],
  });
  server.stdout.on("data", (chunk) => process.stdout.write(`[next] ${chunk}`));
  server.stderr.on("data", (chunk) => process.stderr.write(`[next] ${chunk}`));
  for (let i = 0; i < 60; i += 1) {
    if (server.exitCode !== null) throw new Error(`Next.js exited before readiness (code ${server.exitCode}).`);
    try {
      const response = await fetch(`${baseUrl}/api/health`);
      const body = await response.json();
      if (response.ok && body.database === "connected") return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error("Next.js integration server did not become database-ready.");
}
async function stopServer() {
  if (!server || server.exitCode !== null) return;
  const exited = new Promise((resolve) => server.once("exit", resolve));
  server.kill("SIGTERM");
  await Promise.race([exited, new Promise((resolve) => setTimeout(resolve, 5000))]);
  if (server.exitCode === null) { server.kill("SIGKILL"); await exited; }
}
function post(url, body, cookie = "") {
  return fetch(`${baseUrl}${url}`, { method: "POST", headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) }, body: JSON.stringify(body) });
}
function orderValues(customer, trackingCode, overrides = {}) {
  return { trackingCode, customerId: customer.id, customerName: customer.name, customerPhone: customer.phone, customerAddress: "تهران، آدرس تست", totalAmount: 100000, paymentStatus: "pending", ...overrides };
}

console.log("Running genuine PostgreSQL integration tests...");
try {
  await pool.query("SELECT 1");
  await migrate();
  await reset();
  const seededProducts = await getAllProducts();
  assert.ok(seededProducts.length > 0);
  const product = seededProducts[0];
  await saveSetting("integrationProof", { durable: true });
  assert.deepEqual((await db.select().from(settings).where(eq(settings.key, "integrationProof")))[0]?.value, { durable: true });
  const customerA = (await db.insert(customerUsers).values({ phone: "09121111111", name: "کاربر A" }).returning())[0];
  const customerB = (await db.insert(customerUsers).values({ phone: "09122222222", name: "کاربر B" }).returning())[0];
  const admin = (await db.insert(adminUsers).values({ username: "ci_admin", passwordHash: hashPassword("unused-ci-password") }).returning())[0];
  await startServer();

  await test("initial HTTP checkout stores trusted order and attempt", async () => {
    const response = await post("/api/orders", {
      customerName: customerA.name, customerPhone: customerA.phone, customerAddress: "تهران خیابان آزادی پلاک ۱۰۰",
      customerProvince: "تهران", customerCity: "تهران", postalCode: "1234567890", paymentMethod: "online",
      items: [{ productId: product.id, quantity: 1, price: 1 }],
    }, `akma_customer_session=${createCustomerToken(customerA.phone)}`);
    const body = await response.json();
    assert.equal(response.status, 200, JSON.stringify(body));
    assert.match(body.paymentLink, /^https:\/\/payments\.invalid\//);
    const order = (await db.select().from(orders).where(eq(orders.trackingCode, body.trackingCode)))[0];
    assert.ok(order); assert.notEqual(order.totalAmount, 1);
    const attempts = await db.select().from(paymentAttempts).where(eq(paymentAttempts.orderId, order.id));
    assert.equal(attempts.length, 1); assert.equal(attempts[0].status, "pending");
  });

  await test("canceled callback records failed attempt", async () => {
    const order = (await db.insert(orders).values(orderValues(customerA, "AKM-CANCELED", { paymentTrackId: "TRACK-CANCELED" })).returning())[0];
    await db.insert(paymentAttempts).values({ orderId: order.id, trackId: "TRACK-CANCELED", amount: 100000, amountRials: 1000000 });
    assert.equal((await fetch(`${baseUrl}/api/payment/verify?orderId=AKM-CANCELED&trackId=TRACK-CANCELED&success=0`, { redirect: "manual" })).status, 307);
    assert.equal((await db.select().from(paymentAttempts).where(eq(paymentAttempts.trackId, "TRACK-CANCELED")))[0].status, "failed");
    assert.equal((await db.select().from(orders).where(eq(orders.id, order.id)))[0].paymentStatus, "failed");
  });

  const orderB = (await db.insert(orders).values(orderValues(customerB, "AKM-USER-B")).returning())[0];
  await test("anonymous retry is 401", async () => assert.equal((await post("/api/orders/retry-payment", { trackingCode: orderB.trackingCode })).status, 401));
  await test("User A retrying User B order is 403", async () => assert.equal((await post("/api/orders/retry-payment", { trackingCode: orderB.trackingCode }, `akma_customer_session=${createCustomerToken(customerA.phone)}`)).status, 403));
  await test("User B retries own order", async () => assert.equal((await post("/api/orders/retry-payment", { trackingCode: orderB.trackingCode }, `akma_customer_session=${createCustomerToken(customerB.phone)}`)).status, 200));
  await test("revoked admin is 401", async () => assert.equal((await post("/api/orders/retry-payment", { trackingCode: orderB.trackingCode }, `akma_admin_session=${createSessionToken("revoked_admin")}`)).status, 401));
  await test("valid current admin is authorized", async () => assert.equal((await post("/api/orders/retry-payment", { trackingCode: orderB.trackingCode }, `akma_admin_session=${createSessionToken(admin.username)}`)).status, 200));
  await test("paid order cannot retry", async () => {
    await db.update(orders).set({ paymentStatus: "paid" }).where(eq(orders.id, orderB.id));
    assert.equal((await post("/api/orders/retry-payment", { trackingCode: orderB.trackingCode }, `akma_customer_session=${createCustomerToken(customerB.phone)}`)).status, 400);
  });

  await test("concurrent retries preserve history and one pending", async () => {
    const order = (await db.insert(orders).values(orderValues(customerA, "AKM-RETRY-RACE", { totalAmount: 300000 })).returning())[0];
    await Promise.all([atomicUpdateOrderPaymentRetry(order.id, "RACE-A", "https://payments.invalid/A"), atomicUpdateOrderPaymentRetry(order.id, "RACE-B", "https://payments.invalid/B")]);
    const attempts = await db.select().from(paymentAttempts).where(eq(paymentAttempts.orderId, order.id));
    assert.equal(attempts.length, 2); assert.equal(attempts.filter((a) => a.status === "pending").length, 1); assert.equal(attempts.filter((a) => a.status === "superseded").length, 1);
  });

  await test("successful callbacks retain primary and flag duplicate", async () => {
    const order = (await db.insert(orders).values(orderValues(customerA, "AKM-CALLBACK-RACE")).returning())[0];
    await db.insert(paymentAttempts).values([
      { orderId: order.id, trackId: "CALLBACK-1", amount: 100000, amountRials: 1000000, status: "pending" },
      { orderId: order.id, trackId: "CALLBACK-2", amount: 100000, amountRials: 1000000, status: "superseded" },
    ]);
    const verifier = (refNumber) => async () => ({ success: true, resultCode: 100, refNumber, rawAmountRials: 1000000, paidAt: new Date() });
    const results = await Promise.all([processOrderPaymentVerification(order.trackingCode, "CALLBACK-1", verifier("REF-1")), processOrderPaymentVerification(order.trackingCode, "CALLBACK-2", verifier("REF-2"))]);
    assert.ok(results.every((r) => r.success));
    const attempts = await db.select().from(paymentAttempts).where(eq(paymentAttempts.orderId, order.id));
    assert.equal(attempts.filter((a) => a.status === "paid").length, 1); assert.equal(attempts.filter((a) => a.status === "duplicate_paid").length, 1);
    const current = (await db.select().from(orders).where(eq(orders.id, order.id)))[0];
    assert.ok(["REF-1", "REF-2"].includes(current.paymentRefId)); assert.ok(current.adminNotes.includes("پرداخت دوتایی"));
  });

  await test("application OTP concurrency uses PostgreSQL rate limit", async () => {
    const phone = "09129999999";
    await db.insert(customerOtps).values({ phone, otpHash: "seed", expiresAt: new Date(Date.now() + 120000), lastRequestedAt: new Date(Date.now() - 61000), hourlyRequestCount: 4, hourWindowStart: new Date() });
    const results = await Promise.all([sendCustomerOtp(phone), sendCustomerOtp(phone)]);
    assert.equal(results.filter((r) => r.ok).length, 1);
    const row = (await db.select().from(customerOtps).where(eq(customerOtps.phone, phone)))[0];
    assert.equal(row.hourlyRequestCount, 5); assert.notEqual(row.otpHash, "seed");
  });

  await test("OTP is hashed, persistent and single-use over HTTP", async () => {
    const phone = "09128888888";
    assert.equal((await post("/api/customer/auth", { action: "send_otp", phone })).status, 200);
    assert.notEqual((await db.select().from(customerOtps).where(eq(customerOtps.phone, phone)))[0].otpHash, "54321");
    const responses = await Promise.all([post("/api/customer/auth", { action: "verify_otp", phone, code: "54321", name: "OTP" }), post("/api/customer/auth", { action: "verify_otp", phone, code: "54321", name: "OTP" })]);
    assert.deepEqual(responses.map((r) => r.status).sort(), [200, 400]);
    assert.equal((await db.select().from(customerOtps).where(eq(customerOtps.phone, phone))).length, 0);
  });

  await test("application writes prove no memory fallback", async () => {
    assert.ok((await db.select().from(orders)).length); assert.ok((await db.select().from(paymentAttempts)).length);
    assert.ok((await db.select().from(customerUsers)).length); assert.ok((await db.select().from(settings)).length); assert.ok((await db.select().from(products)).length);
  });
} finally {
  await stopServer();
  await appPool?.end().catch(() => {});
  await pool.end().catch(() => {});
}
console.log(`PostgreSQL integration result: ${passed}/${total} passed`);
if (passed !== total) process.exit(1);
