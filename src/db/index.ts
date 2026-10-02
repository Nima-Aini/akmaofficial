import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;
const integrationMode = process.env.AKMA_INTEGRATION_TEST === "1";
const explicitMemoryMode = process.env.AKMA_ALLOW_MEMORY_STORE === "1";

export const memoryStoreAllowed =
  explicitMemoryMode && process.env.NODE_ENV !== "production" && !integrationMode;

export function assertMemoryStoreAllowed(context: string): void {
  if (!memoryStoreAllowed) {
    throw new Error(
      `[Persistence] PostgreSQL is required for ${context}. ` +
        "Memory storage is available only with AKMA_ALLOW_MEMORY_STORE=1 in local non-production development.",
    );
  }
}

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool | null;
  __arenaNextJsPostgresqlDb?: any;
};

let pool: Pool | null = null;
let db: any = null;

if (databaseUrl) {
  try {
    pool =
      globalForDb.__arenaNextJsPostgresqlPool ??
      new Pool({
        connectionString: databaseUrl,
      });

    if (process.env.NODE_ENV !== "production") {
      globalForDb.__arenaNextJsPostgresqlPool = pool;
    }

    db = globalForDb.__arenaNextJsPostgresqlDb ?? drizzle(pool, { schema });
    if (process.env.NODE_ENV !== "production") {
      globalForDb.__arenaNextJsPostgresqlDb = db;
    }
  } catch (err) {
    console.error("[Database] Failed to initialize PostgreSQL pool:", err);
    pool = null;
    db = null;
  }
}

if (integrationMode && !databaseUrl) {
  throw new Error("AKMA_INTEGRATION_TEST=1 requires DATABASE_URL to be the validated disposable test database.");
}

export { pool, db };

