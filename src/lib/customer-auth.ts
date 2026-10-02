import crypto from "node:crypto";
import { cookies } from "next/headers";
import { assertMemoryStoreAllowed, db } from "@/db";
import { customerUsers, customerOtps, orders, type CustomerUserRow, type OrderRow } from "@/db/schema";
import { and, desc, eq, sql } from "drizzle-orm";
import { normalizePhone, toEnDigits } from "./format";
import { getAllOrders } from "./store";
import { generateSecureOtp, sendOtpSms } from "./sms";

const CUSTOMER_COOKIE = "akma_customer_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days
const OTP_EXPIRY_MS = 1000 * 60 * 2; // 2 minutes
const OTP_RESEND_COOLDOWN_MS = 1000 * 60; // 60 seconds
const MAX_OTP_ATTEMPTS = 5;
const MAX_HOURLY_REQUESTS = 5;

const EPHEMERAL_SECRET = crypto.randomBytes(32).toString("hex");

function secret(): string {
  const envSecret = process.env.ADMIN_SESSION_SECRET || process.env.SESSION_SECRET;
  if (!envSecret && (process.env.NODE_ENV === "production" || process.env.AKMA_INTEGRATION_TEST === "1")) {
    throw new Error(
      "خطای پیکربندی سرور: کلید امنیتی نشست (ADMIN_SESSION_SECRET یا SESSION_SECRET) در محیط پروداکشن تنظیم نشده است.",
    );
  }
  return envSecret || EPHEMERAL_SECRET;
}

function hashOtp(phone: string, code: string): string {
  return crypto.createHmac("sha256", secret()).update(`${phone}:${code}`).digest("hex");
}

function safeCompareHashes(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a, "hex");
    const bufB = Buffer.from(b, "hex");
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

interface MemoryOtpEntry {
  otpHash: string;
  expires: number;
  attempts: number;
  lastRequestedAt: number;
  hourlyRequests: number;
  hourWindowStart: number;
}

const globalForCustomer = globalThis as typeof globalThis & {
  __memoryCustomers?: CustomerUserRow[];
  __memoryOtps?: Map<string, MemoryOtpEntry>;
};

function getCustomerStore(): CustomerUserRow[] {
  assertMemoryStoreAllowed("customer accounts");
  if (!globalForCustomer.__memoryCustomers) {
    globalForCustomer.__memoryCustomers = [];
  }
  return globalForCustomer.__memoryCustomers;
}

function getOtpMap(): Map<string, MemoryOtpEntry> {
  assertMemoryStoreAllowed("customer OTP storage");
  if (!globalForCustomer.__memoryOtps) {
    globalForCustomer.__memoryOtps = new Map();
  }
  return globalForCustomer.__memoryOtps;
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function createCustomerToken(phone: string): string {
  const body = Buffer.from(
    JSON.stringify({ phone, exp: Date.now() + SESSION_TTL_MS }),
    "utf8",
  ).toString("base64url");
  return `${body}.${sign(body)}`;
}

export function verifyCustomerToken(token: string | undefined): string | null {
  if (!token) return null;
  const idx = token.lastIndexOf(".");
  if (idx <= 0) return null;
  const body = token.slice(0, idx);
  const sig = token.slice(idx + 1);
  const expected = sign(body);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (!data.phone || typeof data.exp !== "number" || data.exp < Date.now()) return null;
    return String(data.phone);
  } catch {
    return null;
  }
}

export async function setCustomerSessionCookie(phone: string) {
  const cookieStore = await cookies();
  cookieStore.set(CUSTOMER_COOKIE, createCustomerToken(phone), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export async function clearCustomerSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(CUSTOMER_COOKIE);
}

export async function getSessionCustomerPhone(): Promise<string | null> {
  const cookieStore = await cookies();
  return verifyCustomerToken(cookieStore.get(CUSTOMER_COOKIE)?.value);
}

export async function getCustomerByPhone(rawPhone: string): Promise<CustomerUserRow | null> {
  const phone = normalizePhone(rawPhone);
  if (!phone) return null;

  if (db || process.env.DATABASE_URL) {
    try {
      const rows = await db!.select().from(customerUsers).where(eq(customerUsers.phone, phone)).limit(1);
      if (rows[0]) return rows[0];
      return null;
    } catch (err) {
      if (process.env.DATABASE_URL) {
        console.error("Database query failed for customer lookup:", err);
        throw new Error("خطا در برقراری ارتباط با پایگاه داده مشتریان");
      }
    }
  }

  const mem = getCustomerStore();
  return mem.find((c) => c.phone === phone) ?? null;
}

export async function getCurrentCustomer(): Promise<CustomerUserRow | null> {
  const phone = await getSessionCustomerPhone();
  if (!phone) return null;
  return getCustomerByPhone(phone);
}

export async function sendCustomerOtp(
  rawPhone: string,
): Promise<{ ok: boolean; error?: string; remainingSeconds?: number }> {
  const phone = normalizePhone(rawPhone);
  if (!phone || phone.length < 10 || !/^09\d{9}$/.test(phone)) {
    return { ok: false, error: "شماره تلفن همراه نامعتبر است. لطفاً شماره ۱۱ رقمی وارد کنید." };
  }

  const now = Date.now();
  const code = generateSecureOtp();
  const hashedCode = hashOtp(phone, code);

  // 1. Persistent DB-backed OTP Storage
  if (db || process.env.DATABASE_URL) {
    try {
      const existing = await db!.select().from(customerOtps).where(eq(customerOtps.phone, phone)).limit(1);
      const row = existing[0];

      if (row) {
        const lastReqTime = row.lastRequestedAt.getTime();
        const elapsed = now - lastReqTime;

        // Resend cooldown check
        if (elapsed < OTP_RESEND_COOLDOWN_MS) {
          const remaining = Math.ceil((OTP_RESEND_COOLDOWN_MS - elapsed) / 1000);
          return {
            ok: false,
            error: `لطفاً ${remaining} ثانیه دیگر جهت درخواست مجدد کد صبر کنید.`,
            remainingSeconds: remaining,
          };
        }

        // Hourly request limit check
        const hourStart = row.hourWindowStart.getTime();
        let hourlyCount = row.hourlyRequestCount;
        let newHourStart = row.hourWindowStart;

        if (now - hourStart < 3600000) {
          if (hourlyCount >= MAX_HOURLY_REQUESTS) {
            return {
              ok: false,
              error: "تعداد درخواست‌های کد تایید در این ساعت به حد مجاز رسیده است. لطفاً ساعتی دیگر تلاش کنید.",
            };
          }
          hourlyCount += 1;
        } else {
          hourlyCount = 1;
          newHourStart = new Date(now);
        }

        const updated = await db!
          .update(customerOtps)
          .set({
            otpHash: hashedCode,
            expiresAt: new Date(now + OTP_EXPIRY_MS),
            attemptCount: 0,
            lastRequestedAt: new Date(now),
            hourlyRequestCount: hourlyCount,
            hourWindowStart: newHourStart,
            updatedAt: new Date(now),
          })
          .where(
            and(
              eq(customerOtps.phone, phone),
              eq(customerOtps.lastRequestedAt, row.lastRequestedAt),
            ),
          )
          .returning();

        if (updated.length === 0) {
          return {
            ok: false,
            error: "یک درخواست ارسال کد همزمان انجام گردید. لطفاً چند لحظه دیگر دوباره تلاش کنید.",
          };
        }
      } else {
        await db!.insert(customerOtps).values({
          phone,
          otpHash: hashedCode,
          expiresAt: new Date(now + OTP_EXPIRY_MS),
          attemptCount: 0,
          lastRequestedAt: new Date(now),
          hourlyRequestCount: 1,
          hourWindowStart: new Date(now),
          createdAt: new Date(now),
          updatedAt: new Date(now),
        });
      }

      // Send real SMS
      const smsResult = await sendOtpSms(phone, code);
      if (!smsResult.success) {
        return { ok: false, error: smsResult.error || "خطا در ارسال پیامک کد تأیید" };
      }

      return { ok: true };
    } catch (err) {
      if (process.env.DATABASE_URL) {
        console.error("Database error saving OTP record:", err);
        throw new Error("خطای پایگاه داده در ذخیره کد تأیید");
      }
    }
  }

  // 2. Local Dev Memory Storage (When DATABASE_URL is not defined)
  const otps = getOtpMap();
  const memEntry = otps.get(phone);

  if (memEntry) {
    const elapsed = now - memEntry.lastRequestedAt;
    if (elapsed < OTP_RESEND_COOLDOWN_MS) {
      const remaining = Math.ceil((OTP_RESEND_COOLDOWN_MS - elapsed) / 1000);
      return {
        ok: false,
        error: `لطفاً ${remaining} ثانیه دیگر جهت درخواست مجدد کد صبر کنید.`,
        remainingSeconds: remaining,
      };
    }

    if (now - memEntry.hourWindowStart < 3600000) {
      if (memEntry.hourlyRequests >= MAX_HOURLY_REQUESTS) {
        return {
          ok: false,
          error: "تعداد درخواست‌های کد تایید در این ساعت به حد مجاز رسیده است.",
        };
      }
    }
  }

  const hourStart = memEntry && now - memEntry.hourWindowStart < 3600000 ? memEntry.hourWindowStart : now;
  const hourCount = memEntry && now - memEntry.hourWindowStart < 3600000 ? memEntry.hourlyRequests + 1 : 1;

  otps.set(phone, {
    otpHash: hashedCode,
    expires: now + OTP_EXPIRY_MS,
    attempts: 0,
    lastRequestedAt: now,
    hourlyRequests: hourCount,
    hourWindowStart: hourStart,
  });

  const smsResult = await sendOtpSms(phone, code);
  if (!smsResult.success) {
    return { ok: false, error: smsResult.error || "خطا در ارسال پیامک کد تأیید" };
  }

  return { ok: true };
}

export async function verifyCustomerOtp(
  rawPhone: string,
  rawCode: string,
  name?: string,
): Promise<{ ok: boolean; customer?: CustomerUserRow; error?: string }> {
  const phone = normalizePhone(rawPhone);
  const code = toEnDigits(rawCode).trim();

  if (!phone) return { ok: false, error: "شماره موبایل وارد نشده است." };
  if (!code) return { ok: false, error: "کد تأیید وارد نشده است." };

  const providedHash = hashOtp(phone, code);

  // 1. Persistent DB-backed OTP Verification
  if (db || process.env.DATABASE_URL) {
    try {
      const rows = await db!.select().from(customerOtps).where(eq(customerOtps.phone, phone)).limit(1);
      const row = rows[0];

      if (!row) {
        return { ok: false, error: "کد تأییدی برای این شماره ثبت نشده است یا منقضی شده است." };
      }

      if (row.expiresAt.getTime() < Date.now()) {
        await db!.delete(customerOtps).where(eq(customerOtps.phone, phone));
        return { ok: false, error: "کد تأیید منقضی شده است. لطفاً کد جدید دریافت کنید." };
      }

      const newAttempts = row.attemptCount + 1;
      if (newAttempts > MAX_OTP_ATTEMPTS) {
        await db!.delete(customerOtps).where(eq(customerOtps.phone, phone));
        return { ok: false, error: "تعداد تلاش‌های اشتباه بیش از حد مجاز بود. لطفاً کد جدید درخواست کنید." };
      }

      const isMatch = safeCompareHashes(row.otpHash, providedHash);

      if (!isMatch) {
        const updateResult = await db!
          .update(customerOtps)
          .set({ attemptCount: sql`${customerOtps.attemptCount} + 1`, updatedAt: new Date() })
          .where(and(eq(customerOtps.phone, phone), eq(customerOtps.otpHash, row.otpHash)))
          .returning();

        if (updateResult.length === 0) {
          return { ok: false, error: "کد تأیید قدیمی است و کد جدیدی صادر شده است. لطفاً آخرین کد دریافتی را وارد نمایید." };
        }

        const currentAttempts = updateResult[0]?.attemptCount ?? (row.attemptCount + 1);
        if (currentAttempts >= MAX_OTP_ATTEMPTS) {
          await db!.delete(customerOtps).where(and(eq(customerOtps.phone, phone), eq(customerOtps.otpHash, row.otpHash)));
          return { ok: false, error: "تعداد تلاش‌های اشتباه بیش از حد مجاز بود. لطفاً کد جدید درخواست کنید." };
        }

        const remaining = MAX_OTP_ATTEMPTS - currentAttempts;
        return { ok: false, error: `کد تأیید نادرست است. (${remaining} تلاش باقی مانده)` };
      }

      // Valid OTP -> Atomically consume (delete) matching phone and exact otpHash so stale attempts or concurrent calls cannot reuse or pollute it
      const consumed = await db!
        .delete(customerOtps)
        .where(and(eq(customerOtps.phone, phone), eq(customerOtps.otpHash, row.otpHash)))
        .returning();

      if (consumed.length === 0) {
        return { ok: false, error: "کد تأیید قبلاً استفاده شده است یا کد جدیدی صادر گردیده است." };
      }

      let customer = await getCustomerByPhone(phone);
      const now = new Date();

      if (!customer) {
        const newCustomer = {
          phone,
          name: name?.trim() || "کاربر جدید آکما",
          province: "",
          city: "",
          address: "",
          postalCode: "",
          companyName: "",
          isWholesale: false,
          passwordHash: null,
          createdAt: now,
          updatedAt: now,
        };

        const created = await db!.insert(customerUsers).values(newCustomer).returning();
        if (created[0]) customer = created[0];
      }

      if (!customer) {
        throw new Error("خطا در ثبت مشتری در پایگاه داده");
      }

      await setCustomerSessionCookie(phone);
      return { ok: true, customer };
    } catch (err) {
      if (process.env.DATABASE_URL) {
        console.error("Database error during OTP verification:", err);
        throw new Error("خطای پایگاه داده در تایید کد ورود");
      }
    }
  }

  // 2. Memory Verification (For Local Sandbox Dev without DATABASE_URL)
  const otps = getOtpMap();
  const memEntry = otps.get(phone);

  if (!memEntry) {
    return { ok: false, error: "کد تأییدی برای این شماره ثبت نشده است یا منقضی شده است." };
  }

  if (memEntry.expires < Date.now()) {
    otps.delete(phone);
    return { ok: false, error: "کد تأیید منقضی شده است. لطفاً کد جدید دریافت کنید." };
  }

  memEntry.attempts += 1;
  if (memEntry.attempts > MAX_OTP_ATTEMPTS) {
    otps.delete(phone);
    return { ok: false, error: "تعداد تلاش‌های اشتباه بیش از حد مجاز بود." };
  }

  const isMatch = safeCompareHashes(memEntry.otpHash, providedHash);
  if (!isMatch) {
    const remaining = MAX_OTP_ATTEMPTS - memEntry.attempts;
    return { ok: false, error: `کد تأیید نادرست است. (${remaining} تلاش باقی مانده)` };
  }

  otps.delete(phone);

  let customer = await getCustomerByPhone(phone);
  const now = new Date();

  if (!customer) {
    const mem = getCustomerStore();
    const nextId = mem.length > 0 ? Math.max(...mem.map((c) => c.id)) + 1 : 1;
    customer = {
      id: nextId,
      phone,
      name: name?.trim() || "کاربر جدید آکما",
      province: "",
      city: "",
      address: "",
      postalCode: "",
      companyName: "",
      isWholesale: false,
      passwordHash: null,
      createdAt: now,
      updatedAt: now,
    };
    mem.push(customer);
  }

  await setCustomerSessionCookie(phone);
  return { ok: true, customer };
}

export async function updateCustomerProfile(
  rawPhone: string,
  data: {
    name?: string;
    province?: string;
    city?: string;
    address?: string;
    postalCode?: string;
    companyName?: string;
    isWholesale?: boolean;
  },
): Promise<CustomerUserRow | null> {
  const phone = normalizePhone(rawPhone);
  if (!phone) return null;

  const patch = {
    ...(data.name !== undefined ? { name: data.name.trim() } : {}),
    ...(data.province !== undefined ? { province: data.province.trim() } : {}),
    ...(data.city !== undefined ? { city: data.city.trim() } : {}),
    ...(data.address !== undefined ? { address: data.address.trim() } : {}),
    ...(data.postalCode !== undefined ? { postalCode: toEnDigits(data.postalCode).trim() } : {}),
    ...(data.companyName !== undefined ? { companyName: data.companyName.trim() } : {}),
    ...(data.isWholesale !== undefined ? { isWholesale: Boolean(data.isWholesale) } : {}),
    updatedAt: new Date(),
  };

  if (db || process.env.DATABASE_URL) {
    try {
      const rows = await db!
        .update(customerUsers)
        .set(patch)
        .where(eq(customerUsers.phone, phone))
        .returning();
      if (rows[0]) return rows[0];
      return null;
    } catch (err) {
      if (process.env.DATABASE_URL) {
        console.error("Failed to update customer in DB:", err);
        throw new Error("خطا در ذخیره اطلاعات کاربری در پایگاه داده");
      }
    }
  }

  const mem = getCustomerStore();
  const idx = mem.findIndex((c) => c.phone === phone);
  if (idx !== -1) {
    mem[idx] = { ...mem[idx], ...patch };
    return mem[idx];
  }

  return null;
}

export async function getCustomerOrders(phoneOrId: string | number): Promise<OrderRow[]> {
  const phoneNorm = typeof phoneOrId === "string" ? normalizePhone(phoneOrId) : null;
  const idNum = typeof phoneOrId === "number" ? phoneOrId : null;

  if (db || process.env.DATABASE_URL) {
    try {
      const condition = idNum
        ? eq(orders.customerId, idNum)
        : eq(orders.customerPhone, phoneNorm || "");
      return await db!
        .select()
        .from(orders)
        .where(condition)
        .orderBy(desc(orders.createdAt));
    } catch (err) {
      if (process.env.DATABASE_URL) {
        console.error("Database error fetching customer orders:", err);
        throw new Error("خطا در دریافت لیست سفارشات از پایگاه داده");
      }
    }
  }

  const all = await getAllOrders();
  return all.filter((o) => {
    if (idNum && o.customerId === idNum) return true;
    if (phoneNorm && normalizePhone(o.customerPhone) === phoneNorm) return true;
    return false;
  });
}
