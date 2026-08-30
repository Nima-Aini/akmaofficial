import { NextResponse } from "next/server";
import {
  getSessionUsername,
  hashPassword,
  requireAdmin,
  setSessionCookie,
  updateAdminCredentials,
  verifyAdminCredentials,
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
    const isValid = await verifyAdminCredentials(sessionUser, String(currentPassword ?? ""));
    if (!isValid) {
      return NextResponse.json(
        { ok: false, error: "رمز عبور فعلی اشتباه است" },
        { status: 400 },
      );
    }
    const newUsername =
      typeof username === "string" && username.trim().length >= 4
        ? username.trim()
        : sessionUser;
    let newHash: string | undefined = undefined;
    if (typeof password === "string" && password.length > 0) {
      if (password.length < 10) {
        return NextResponse.json(
          { ok: false, error: "رمز عبور جدید باید حداقل ۱۰ کاراکتر باشد" },
          { status: 400 },
        );
      }
      newHash = hashPassword(password);
    }
    await updateAdminCredentials(sessionUser, newUsername, newHash);
    await setSessionCookie(newUsername);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "خطای سرور" }, { status: 500 });
  }
}

