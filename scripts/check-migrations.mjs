import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const migrationsRoot = path.resolve("migrations");
const forbidden = [
  /\bDROP\s+(TABLE|COLUMN|SCHEMA|DATABASE|INDEX|TYPE)\b/i,
  /\bTRUNCATE\b/i,
  /\bDELETE\s+FROM\b/i,
  /\bALTER\s+TABLE\b[\s\S]*?\bRENAME\b/i,
  /\bALTER\s+COLUMN\b[\s\S]*?\bSET\s+NOT\s+NULL\b/i,
  /\bALTER\s+COLUMN\b[\s\S]*?\bTYPE\b/i,
];

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

let failed = false;
for (const file of await findSqlFiles(migrationsRoot)) {
  const sql = await readFile(file, "utf8");
  for (const pattern of forbidden) {
    if (pattern.test(sql)) {
      console.error(`Unsafe automatic migration: ${path.relative(process.cwd(), file)}`);
      console.error(`Matched rule: ${pattern}`);
      failed = true;
    }
  }
}

if (failed) {
  console.error("Destructive database changes require a separate, reviewed maintenance plan.");
  process.exit(1);
}

console.log("Migration safety check passed.");
