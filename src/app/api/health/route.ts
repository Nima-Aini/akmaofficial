import { db } from "@/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  if (db) {
    try {
      await db.execute(sql`select 1`);
      return Response.json({ ok: true, status: "healthy", database: "connected" });
    } catch {
      return Response.json({ ok: true, status: "healthy", database: "fallback_memory" });
    }
  }
  return Response.json({ ok: true, status: "healthy", database: "fallback_memory" });
}

