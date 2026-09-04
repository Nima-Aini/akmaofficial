import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import pg from "pg";

const { Client } = pg;
const migrationsRoot = path.resolve("migrations");
const databaseUrl = process.env.DATABASE_URL;
const lockId = "6509423410294931";

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to run migrations.");
}

async function findSqlFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await findSqlFiles(fullPath)));
    if (entry.isFile() && entry.name.endsWith(".sql")) files.push(fullPath);
  }
  return files.sort();
}

const client = new Client({ connectionString: databaseUrl });
await client.connect();

try {
  await client.query("SELECT pg_advisory_lock($1::bigint)", [lockId]);
  await client.query(`
    CREATE TABLE IF NOT EXISTS deployment_migrations (
      filename text PRIMARY KEY,
      checksum text NOT NULL,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  const files = await findSqlFiles(migrationsRoot);
  for (const file of files) {
    const filename = path.relative(migrationsRoot, file).replaceAll("\\", "/");
    const sql = await readFile(file, "utf8");
    const checksum = createHash("sha256").update(sql).digest("hex");
    const existing = await client.query(
      "SELECT checksum FROM deployment_migrations WHERE filename = $1",
      [filename],
    );

    if (existing.rows[0]) {
      if (existing.rows[0].checksum !== checksum) {
        throw new Error(`Applied migration was modified: ${filename}`);
      }
      console.log(`Already applied: ${filename}`);
      continue;
    }

    await client.query("BEGIN");
    try {
      await client.query(sql);
      await client.query(
        "INSERT INTO deployment_migrations (filename, checksum) VALUES ($1, $2)",
        [filename, checksum],
      );
      await client.query("COMMIT");
      console.log(`Applied: ${filename}`);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  }
} finally {
  await client.query("SELECT pg_advisory_unlock($1::bigint)", [lockId]).catch(() => {});
  await client.end();
}
