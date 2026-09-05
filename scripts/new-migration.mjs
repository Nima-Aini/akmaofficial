import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const rawName = process.argv.slice(2).join("-").toLowerCase();
const name = rawName
  .replace(/[^a-z0-9-]+/g, "-")
  .replace(/-+/g, "-")
  .replace(/^-|-$/g, "");

if (!name) {
  throw new Error("Usage: pnpm db:migration:new -- add-product-field");
}

const now = new Date();
const timestamp = now.toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
const directory = path.resolve("migrations");
const file = path.join(directory, `${timestamp}_${name}.sql`);

await mkdir(directory, { recursive: true });
await writeFile(
  file,
  "-- Add only backward-compatible schema changes here.\n-- Destructive changes must use a reviewed maintenance deployment.\n\n",
  { flag: "wx" },
);
console.log(path.relative(process.cwd(), file));
