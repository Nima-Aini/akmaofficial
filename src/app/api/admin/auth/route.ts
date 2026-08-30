import { NextResponse } from "next/server";
import { db } from "@/db";
import { adminUsers } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  clearSessionCookie,
  setSessionCookie,
  verifyPassword,
} from "@/lib/auth";
import { ensureSeeded } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();
    if (typeof username !== "string" || typeof password !== "string") {
      return NextResponse.json({ ok: false, error: "اطلاعات نامعتبر است" }, { status: 400 });
    }
    await ensureSeeded();
    const rows = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.username, username.trim()))
      .limit(1);
    const admin = rows[0];
    if (!admin || !verifyPassword(password, admin.passwordHash)) {
      return NextResponse.json(
        { ok: false, error: "نام کاربری یا رمز عبور اشتباه است" },
        { status: 401 },
      );
    }
    await setSessionCookie(admin.username);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "خطای سرور" }, { status: 500 });
  }
}

export async function DELETE() {
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
