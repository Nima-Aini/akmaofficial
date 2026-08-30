import { db } from "@/db";
import { adminUsers, products, settings, type ProductRow } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { DEFAULT_ADMIN, DEFAULT_SETTINGS, PRODUCT_SEEDS } from "./defaults";
import { hashPassword } from "./auth";

let seeded = false;

export async function ensureSeeded() {
  if (seeded) return;
  try {
    // settings
    for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
      await db
        .insert(settings)
        .values({ key, value })
        .onConflictDoNothing({ target: settings.key });
    }
    // products
    const existing = await db.select({ id: products.id }).from(products).limit(1);
    if (existing.length === 0) {
      await db.insert(products).values(
        PRODUCT_SEEDS.map((p) => ({
          name: p.name,
          slug: p.slug,
          subtitle: p.subtitle,
          description: p.description,
          features: p.features,
          contents: p.contents,
          price: p.price,
          unitPrice: p.unitPrice,
          category: p.category,
          categoryLabel: p.categoryLabel,
          images: p.images,
          badge: p.badge,
          featured: p.featured,
          sortOrder: p.sortOrder,
          inStock: true,
          active: true,
        })),
      );
    }
    // admin
    const admins = await db.select({ id: adminUsers.id }).from(adminUsers).limit(1);
    if (admins.length === 0) {
      await db.insert(adminUsers).values({
        username: DEFAULT_ADMIN.username,
        passwordHash: hashPassword(DEFAULT_ADMIN.password),
      });
    }
    seeded = true;
  } catch (e) {
    // DB might not be ready during build; pages will retry at runtime.
    console.error("seed error", e);
  }
}

export async function getSettings<T = Record<string, unknown>>(): Promise<
  Record<string, unknown> & T
> {
  const out: Record<string, unknown> = { ...DEFAULT_SETTINGS };
  try {
    await ensureSeeded();
    const rows = await db.select().from(settings);
    for (const row of rows) out[row.key] = row.value;
  } catch {
    // fall back to defaults
  }
  return out as Record<string, unknown> & T;
}

export async function getSetting<K = unknown>(key: string): Promise<K> {
  const all = await getSettings();
  return all[key] as K;
}

export async function saveSetting(key: string, value: unknown) {
  await db
    .insert(settings)
    .values({ key, value, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: settings.key,
      set: { value, updatedAt: new Date() },
    });
}

export async function getAllProducts(): Promise<ProductRow[]> {
  try {
    await ensureSeeded();
    return await db.select().from(products).orderBy(asc(products.sortOrder));
  } catch {
    return [];
  }
}

export async function getActiveProducts(): Promise<ProductRow[]> {
  const all = await getAllProducts();
  return all.filter((p) => p.active);
}

export async function getProductBySlug(slug: string): Promise<ProductRow | null> {
  try {
    await ensureSeeded();
    const rows = await db
      .select()
      .from(products)
      .where(eq(products.slug, slug))
      .limit(1);
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

export type ProductInput = {
  name: string;
  slug: string;
  subtitle: string;
  description: string;
  features: string[];
  contents: string[];
  price: number;
  unitPrice: string;
  category: string;
  categoryLabel: string;
  images: string[];
  badge: string;
  inStock: boolean;
  featured: boolean;
  sortOrder: number;
  active: boolean;
};

export async function createProduct(input: ProductInput): Promise<ProductRow> {
  const rows = await db.insert(products).values(input).returning();
  return rows[0];
}

export async function updateProduct(
  id: number,
  input: Partial<ProductInput>,
): Promise<ProductRow | null> {
  const rows = await db
    .update(products)
    .set(input)
    .where(eq(products.id, id))
    .returning();
  return rows[0] ?? null;
}

export async function deleteProduct(id: number) {
  await db.delete(products).where(eq(products.id, id));
}

export function sanitizeProduct(body: Record<string, unknown>): ProductInput {
  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const arr = (v: unknown) =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  const name = str(body.name) || "محصول بدون نام";
  return {
    name,
    slug: str(body.slug) ? slugify(str(body.slug)) : slugify(name),
    subtitle: str(body.subtitle),
    description: str(body.description),
    features: arr(body.features),
    contents: arr(body.contents),
    price: Math.max(0, Number(body.price) || 0),
    unitPrice: str(body.unitPrice),
    category: str(body.category) || "foam",
    categoryLabel: str(body.categoryLabel) || "فوم تمیزکننده",
    images: arr(body.images),
    badge: str(body.badge),
    inStock: body.inStock !== false,
    featured: body.featured === true,
    sortOrder: Number(body.sortOrder) || 0,
    active: body.active !== false,
  };
}

export function slugify(text: string): string {
  const base = text
    .trim()
    .toLowerCase()
    .replace(/[\u064B-\u0652\u0640]/g, "")
    .replace(/[\s_‌]+/g, "-")
    .replace(/[^\p{L}\p{N}-]/gu, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return base || `product-${Date.now()}`;
}
