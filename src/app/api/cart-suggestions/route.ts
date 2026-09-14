import { NextResponse } from "next/server";
import { getCartSuggestions } from "@/lib/content-store";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const ids = new URL(req.url).searchParams.get("productIds") ?? "";
  const productIds = ids.split(",").map(Number).filter((id) => Number.isInteger(id) && id > 0);
  const suggestions = await getCartSuggestions(productIds);
  return NextResponse.json({ ok: true, suggestions });
}
