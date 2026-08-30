import { NextResponse } from "next/server";
import { db } from "@/db";
import { adminUsers } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  getSessionUsername,
  hashPassword,
  requireAdmin,
  setSessionCookie,
  verifyPassword,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PUT(req: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  try {
    const { currentPassword, username, password } = await req.json();
    const sessionUser = await getSessionUsername();
    if (!sessionUser) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }
    const rows = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.username, sessionUser))
      .limit(1);
    const admin = rows[0];
    if (!admin || !verifyPassword(String(currentPassword ?? ""), admin.passwordHash)) {
      return NextResponse.json(
        { ok: false, error: "رمز عبور فعلی اشتباه است" },
        { status: 400 },
      );
    }
    const newUsername =
      typeof username === "string" && username.trim().length >= 4
        ? username.trim()
        : admin.username;
    let newHash = admin.passwordHash;
    if (typeof password === "string" && password.length > 0) {
      if (password.length < 10) {
        return NextResponse.json(
          { ok: false, error: "رمز عبور جدید باید حداقل ۱۰ کاراکتر باشد" },
          { status: 400 },
        );
      }
      newHash = hashPassword(password);
    }
    await db
      .update(adminUsers)
      .set({ username: newUsername, passwordHash: newHash })
      .where(eq(adminUsers.id, admin.id));
    await setSessionCookie(newUsername);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "خطای سرور" }, { status: 500 });
  }
}
