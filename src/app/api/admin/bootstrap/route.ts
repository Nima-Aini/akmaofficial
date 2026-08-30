import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getAllProducts, getSettings } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const [settings, products] = await Promise.all([getSettings(), getAllProducts()]);
  return NextResponse.json({ ok: true, settings, products });
}
