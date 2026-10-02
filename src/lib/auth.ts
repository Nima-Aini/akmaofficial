import crypto from "node:crypto";
import { cookies } from "next/headers";
import { assertMemoryStoreAllowed, db } from "@/db";
import { adminUsers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getMemoryAdmins, updateMemoryAdmin } from "./store";

const SESSION_COOKIE = "akma_admin_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 12; // 12h
const EPHEMERAL_SESSION_SECRET = crypto.randomBytes(32).toString("hex");

function secret(): string {
  const configured = process.env.ADMIN_SESSION_SECRET || process.env.SESSION_SECRET;
  if (!configured && (process.env.NODE_ENV === "production" || process.env.AKMA_INTEGRATION_TEST === "1")) {
    throw new Error("ADMIN_SESSION_SECRET or SESSION_SECRET is required for stable secure sessions.");
  }
  return configured || EPHEMERAL_SESSION_SECRET;
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 64);
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  const hash = crypto.scryptSync(password, Buffer.from(saltHex, "hex"), 64);
  const expected = Buffer.from(hashHex, "hex");
  return hash.length === expected.length && crypto.timingSafeEqual(hash, expected);
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function createSessionToken(username: string): string {
  const body = Buffer.from(
    JSON.stringify({ u: username, exp: Date.now() + SESSION_TTL_MS }),
    "utf8",
  ).toString("base64url");
  return `${body}.${sign(body)}`;
}

export async function getAdminUsername(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const username = verifySessionToken(token);
  if (!username) return null;

  if (db || process.env.DATABASE_URL) {
    try {
      const rows = await db!
        .select({ username: adminUsers.username })
        .from(adminUsers)
        .where(eq(adminUsers.username, username))
        .limit(1);
      if (rows.length > 0) return rows[0].username;
      return null;
    } catch (err) {
      if (process.env.DATABASE_URL) throw new Error("خطا در بررسی مجوزهای مدیریت", { cause: err });
    }
  }

  assertMemoryStoreAllowed("admin authorization");
  const memAdmins = getMemoryAdmins();
  if (memAdmins.some((a) => a.username === username)) return username;
  return null;
}

export function verifySessionToken(token: string | undefined): string | null {
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
    if (!data.u || typeof data.exp !== "number" || data.exp < Date.now()) return null;
    return String(data.u);
  } catch {
    return null;
  }
}

export async function setSessionCookie(username: string) {
  const store = await cookies();
  store.set(SESSION_COOKIE, createSessionToken(username), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function getSessionUsername(): Promise<string | null> {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}

export async function requireAdmin(): Promise<boolean> {
  const username = await getSessionUsername();
  if (!username) return false;
  if (db) {
    try {
      const rows = await db
        .select({ id: adminUsers.id })
        .from(adminUsers)
        .where(eq(adminUsers.username, username))
        .limit(1);
      return rows.length > 0;
    } catch (err) {
      throw new Error("خطا در بررسی نشست مدیریت", { cause: err });
    }
  }
  assertMemoryStoreAllowed("admin authorization");
  const memAdmins = getMemoryAdmins();
  return memAdmins.some((a) => a.username === username);
}

export async function verifyAdminCredentials(username: string, password: string): Promise<boolean> {
  if (db) {
    try {
      const rows = await db
        .select()
        .from(adminUsers)
        .where(eq(adminUsers.username, username))
        .limit(1);
      if (rows[0]) {
        return verifyPassword(password, rows[0].passwordHash);
      }
    } catch (err) {
      throw new Error("خطا در بررسی اطلاعات ورود مدیریت", { cause: err });
    }
  }
  assertMemoryStoreAllowed("admin credential verification");
  const memAdmins = getMemoryAdmins();
  const found = memAdmins.find((a) => a.username === username);
  if (!found) return false;
  return verifyPassword(password, found.passwordHash);
}

export async function updateAdminCredentials(
  sessionUser: string,
  newUsername: string,
  newPasswordHash?: string,
): Promise<boolean> {
  if (db) {
    try {
      const rows = await db
        .select()
        .from(adminUsers)
        .where(eq(adminUsers.username, sessionUser))
        .limit(1);
      const admin = rows[0];
      if (!admin) return false;
      await db
        .update(adminUsers)
        .set({
          username: newUsername,
          ...(newPasswordHash ? { passwordHash: newPasswordHash } : {}),
        })
        .where(eq(adminUsers.id, admin.id));
      return true;
    } catch (e) {
      throw new Error("خطا در ذخیره اطلاعات ورود مدیریت", { cause: e });
    }
  }
  assertMemoryStoreAllowed("admin credential updates");
  return updateMemoryAdmin(sessionUser, newUsername, newPasswordHash);
}

