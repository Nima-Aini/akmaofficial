import { NextResponse } from "next/server";
import {
  clearSessionCookie,
  setSessionCookie,
  verifyAdminCredentials,
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
    const cleanUsername = username.trim();
    const valid = await verifyAdminCredentials(cleanUsername, password);
    if (!valid) {
      return NextResponse.json(
        { ok: false, error: "نام کاربری یا رمز عبور اشتباه است" },
        { status: 401 },
      );
    }
    await setSessionCookie(cleanUsername);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "خطای سرور" }, { status: 500 });
  }
}

export async function DELETE() {
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}

