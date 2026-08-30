import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;

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
    console.warn("[Database] Failed to initialize PostgreSQL pool:", err);
    pool = null;
    db = null;
  }
}

export { pool, db };

