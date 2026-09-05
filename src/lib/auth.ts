import crypto from "node:crypto";
import { cookies } from "next/headers";
import { db } from "@/db";
import { adminUsers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getMemoryAdmins, updateMemoryAdmin } from "./store";

const SESSION_COOKIE = "akma_admin_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 12; // 12h
const EPHEMERAL_SESSION_SECRET = crypto.randomBytes(32).toString("hex");

function secret(): string {
  return process.env.ADMIN_SESSION_SECRET || EPHEMERAL_SESSION_SECRET;
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
      if (rows.length > 0) return true;
    } catch {
      // check memory store fallback
    }
  }
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
    } catch {
      // fallback to memory
    }
  }
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
  updateMemoryAdmin(sessionUser, newUsername, newPasswordHash);
  if (db) {
    try {
      const rows = await db
        .select()
        .from(adminUsers)
        .where(eq(adminUsers.username, sessionUser))
        .limit(1);
      const admin = rows[0];
      if (admin) {
        await db
          .update(adminUsers)
          .set({
            username: newUsername,
            ...(newPasswordHash ? { passwordHash: newPasswordHash } : {}),
          })
          .where(eq(adminUsers.id, admin.id));
      }
    } catch (e) {
      console.warn("Failed to update admin credentials in DB:", e);
    }
  }
  return true;
}

