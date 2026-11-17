import { NextResponse } from "next/server";
import { getCartSuggestions } from "@/lib/content-store";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const ids = new URL(req.url).searchParams.get("productIds") ?? "";
  const mode = new URL(req.url).searchParams.get("mode");
  if (mode !== "retail" && mode !== "wholesale") return NextResponse.json({ ok: false, error: "نوع فروش نامعتبر است" }, { status: 400 });
  const productIds = ids.split(",").map(Number).filter((id) => Number.isInteger(id) && id > 0);
  const suggestions = await getCartSuggestions(productIds, mode);
  return NextResponse.json({ ok: true, suggestions });
}
