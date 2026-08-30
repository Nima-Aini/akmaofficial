import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createProduct, sanitizeProduct } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const created = await createProduct(sanitizeProduct(body));
    return NextResponse.json({ ok: true, product: created });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "خطای سرور" },
      { status: 500 },
    );
  }
}
