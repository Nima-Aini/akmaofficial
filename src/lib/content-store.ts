import { and, asc, desc, eq, inArray, lte } from "drizzle-orm";
import { db } from "@/db";
import {
  blogPosts,
  cartProductSuggestions,
  type BlogContentBlock,
  type BlogPostRow,
  type CartProductSuggestionRow,
  type ProductRow,
} from "@/db/schema";
import { getAllProducts, slugify } from "@/lib/store";

type ContentMemory = {
  suggestions: CartProductSuggestionRow[];
  posts: BlogPostRow[];
};

const globalContent = globalThis as typeof globalThis & { __akmaContentMemory?: ContentMemory };

function memory(): ContentMemory {
  globalContent.__akmaContentMemory ??= { suggestions: [], posts: [] };
  return globalContent.__akmaContentMemory;
}

function nextId(rows: { id: number }[]) {
  return rows.length ? Math.max(...rows.map((row) => row.id)) + 1 : 1;
}

export type SuggestionInput = {
  triggerProductId: number;
  suggestedProductId: number;
  message: string;
  active: boolean;
  sortOrder: number;
};

export function sanitizeSuggestion(body: Record<string, unknown>): SuggestionInput {
  const triggerProductId = Number(body.triggerProductId);
  const suggestedProductId = Number(body.suggestedProductId);
  if (!Number.isInteger(triggerProductId) || triggerProductId <= 0) throw new Error("محصول محرک نامعتبر است");
  if (!Number.isInteger(suggestedProductId) || suggestedProductId <= 0) throw new Error("محصول پیشنهادی نامعتبر است");
  if (triggerProductId === suggestedProductId) throw new Error("محصول محرک و پیشنهادی نمی‌توانند یکسان باشند");
  return {
    triggerProductId,
    suggestedProductId,
    message: typeof body.message === "string" ? body.message.trim().slice(0, 1000) : "",
    active: body.active !== false,
    sortOrder: Number.isFinite(Number(body.sortOrder)) ? Math.trunc(Number(body.sortOrder)) : 0,
  };
}

async function validateSuggestionProducts(input: SuggestionInput) {
  const products = await getAllProducts();
  if (!products.some((p) => p.id === input.triggerProductId)) throw new Error("محصول محرک پیدا نشد");
  if (!products.some((p) => p.id === input.suggestedProductId)) throw new Error("محصول پیشنهادی پیدا نشد");
}

export async function getAllSuggestions(): Promise<CartProductSuggestionRow[]> {
  if (db) return db.select().from(cartProductSuggestions).orderBy(asc(cartProductSuggestions.sortOrder), desc(cartProductSuggestions.createdAt));
  return [...memory().suggestions].sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function createSuggestion(input: SuggestionInput) {
  await validateSuggestionProducts(input);
  if (db) {
    const rows = await db.insert(cartProductSuggestions).values(input).returning();
    return rows[0];
  }
  if (memory().suggestions.some((r) => r.triggerProductId === input.triggerProductId && r.suggestedProductId === input.suggestedProductId)) {
    throw new Error("این پیشنهاد قبلاً تعریف شده است");
  }
  const now = new Date();
  const row: CartProductSuggestionRow = { id: nextId(memory().suggestions), ...input, createdAt: now, updatedAt: now };
  memory().suggestions.push(row);
  return row;
}

export async function updateSuggestion(id: number, input: SuggestionInput) {
  await validateSuggestionProducts(input);
  if (db) {
    const rows = await db.update(cartProductSuggestions).set({ ...input, updatedAt: new Date() }).where(eq(cartProductSuggestions.id, id)).returning();
    return rows[0] ?? null;
  }
  const index = memory().suggestions.findIndex((row) => row.id === id);
  if (index < 0) return null;
  memory().suggestions[index] = { ...memory().suggestions[index], ...input, updatedAt: new Date() };
  return memory().suggestions[index];
}

export async function deleteSuggestion(id: number) {
  if (db) return db.delete(cartProductSuggestions).where(eq(cartProductSuggestions.id, id));
  memory().suggestions = memory().suggestions.filter((row) => row.id !== id);
}

export type PublicCartSuggestion = CartProductSuggestionRow & { suggestedProduct: ProductRow };

export async function getCartSuggestions(triggerIds: number[]): Promise<PublicCartSuggestion[]> {
  const uniqueIds = [...new Set(triggerIds.filter((id) => Number.isInteger(id) && id > 0))].slice(0, 50);
  if (!uniqueIds.length) return [];
  const [rules, products] = await Promise.all([
    db
      ? db.select().from(cartProductSuggestions).where(and(eq(cartProductSuggestions.active, true), inArray(cartProductSuggestions.triggerProductId, uniqueIds))).orderBy(asc(cartProductSuggestions.sortOrder))
      : Promise.resolve(memory().suggestions.filter((row) => row.active && row.triggerProductId !== null && uniqueIds.includes(row.triggerProductId)).sort((a, b) => a.sortOrder - b.sortOrder)),
    getAllProducts(),
  ]);
  const productMap = new Map(products.map((product) => [product.id, product]));
  return rules.flatMap((rule: CartProductSuggestionRow) => {
    const product = rule.suggestedProductId ? productMap.get(rule.suggestedProductId) : undefined;
    if (!product || !product.active || !product.inStock || uniqueIds.includes(product.id)) return [];
    return [{ ...rule, suggestedProduct: product }];
  });
}

const BLOCK_TYPES = new Set<BlogContentBlock["type"]>([
  "paragraph", "h2", "h3", "bulletList", "numberedList", "quote", "image", "divider",
]);

function cleanUrl(value: unknown): string {
  if (typeof value !== "string") return "";
  const url = value.trim();
  return url.startsWith("/") || /^https:\/\//i.test(url) ? url.slice(0, 2000) : "";
}

function sanitizeBlocks(value: unknown): BlogContentBlock[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 300).flatMap((raw, index) => {
    if (!raw || typeof raw !== "object") return [];
    const block = raw as Record<string, unknown>;
    if (!BLOCK_TYPES.has(block.type as BlogContentBlock["type"])) return [];
    const type = block.type as BlogContentBlock["type"];
    const item: BlogContentBlock = {
      id: typeof block.id === "string" && block.id ? block.id.slice(0, 100) : `block-${Date.now()}-${index}`,
      type,
    };
    if (typeof block.text === "string") item.text = block.text.slice(0, 20000);
    if (Array.isArray(block.items)) item.items = block.items.filter((x): x is string => typeof x === "string").slice(0, 100).map((x) => x.slice(0, 2000));
    if (type === "image") {
      item.url = cleanUrl(block.url);
      item.alt = typeof block.alt === "string" ? block.alt.trim().slice(0, 300) : "";
      item.caption = typeof block.caption === "string" ? block.caption.trim().slice(0, 500) : "";
    }
    return [item];
  });
}

export type BlogPostInput = {
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string;
  coverImageAlt: string;
  content: BlogContentBlock[];
  seoTitle: string;
  metaDescription: string;
  status: "draft" | "published";
  author: string;
  featured: boolean;
  sortOrder: number;
  publishedAt: Date | null;
};

export function sanitizeBlogPost(body: Record<string, unknown>): BlogPostInput {
  const text = (value: unknown, max: number) => typeof value === "string" ? value.trim().slice(0, max) : "";
  const title = text(body.title, 300);
  if (!title) throw new Error("عنوان مقاله الزامی است");
  const rawDate = typeof body.publishedAt === "string" && body.publishedAt ? new Date(body.publishedAt) : null;
  const status = body.status === "published" ? "published" : "draft";
  return {
    title,
    slug: slugify(text(body.slug, 300) || title),
    excerpt: text(body.excerpt, 1000),
    coverImage: cleanUrl(body.coverImage),
    coverImageAlt: text(body.coverImageAlt, 300),
    content: sanitizeBlocks(body.content),
    seoTitle: text(body.seoTitle, 300),
    metaDescription: text(body.metaDescription, 500),
    status,
    author: text(body.author, 200),
    featured: body.featured === true,
    sortOrder: Number.isFinite(Number(body.sortOrder)) ? Math.trunc(Number(body.sortOrder)) : 0,
    publishedAt: rawDate && !Number.isNaN(rawDate.getTime()) ? rawDate : status === "published" ? new Date() : null,
  };
}

export async function getAllBlogPosts(): Promise<BlogPostRow[]> {
  if (db) return db.select().from(blogPosts).orderBy(desc(blogPosts.updatedAt));
  return [...memory().posts].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
}

export async function createBlogPost(input: BlogPostInput): Promise<BlogPostRow> {
  const now = new Date();
  if (db) {
    const rows = await db.insert(blogPosts).values({ ...input, createdAt: now, updatedAt: now }).returning();
    return rows[0];
  }
  if (memory().posts.some((post) => post.slug === input.slug)) throw new Error("این آدرس مقاله قبلاً استفاده شده است");
  const row: BlogPostRow = { id: nextId(memory().posts), ...input, createdAt: now, updatedAt: now };
  memory().posts.push(row);
  return row;
}

export async function updateBlogPost(id: number, input: BlogPostInput): Promise<BlogPostRow | null> {
  if (db) {
    const rows = await db.update(blogPosts).set({ ...input, updatedAt: new Date() }).where(eq(blogPosts.id, id)).returning();
    return rows[0] ?? null;
  }
  const index = memory().posts.findIndex((post) => post.id === id);
  if (index < 0) return null;
  memory().posts[index] = { ...memory().posts[index], ...input, updatedAt: new Date() };
  return memory().posts[index];
}

export async function deleteBlogPost(id: number) {
  if (db) return db.delete(blogPosts).where(eq(blogPosts.id, id));
  memory().posts = memory().posts.filter((post) => post.id !== id);
}

export async function getPublishedBlogPosts(): Promise<BlogPostRow[]> {
  const now = new Date();
  if (db) return db.select().from(blogPosts).where(and(eq(blogPosts.status, "published"), lte(blogPosts.publishedAt, now))).orderBy(desc(blogPosts.featured), desc(blogPosts.publishedAt), asc(blogPosts.sortOrder));
  return memory().posts.filter((post) => post.status === "published" && post.publishedAt && post.publishedAt <= now).sort((a, b) => Number(b.featured) - Number(a.featured) || (b.publishedAt?.getTime() ?? 0) - (a.publishedAt?.getTime() ?? 0));
}

export async function getPublishedBlogPostBySlug(slug: string): Promise<BlogPostRow | null> {
  const decoded = (() => { try { return decodeURIComponent(slug); } catch { return slug; } })();
  if (db) {
    const rows = await db.select().from(blogPosts).where(and(eq(blogPosts.slug, decoded), eq(blogPosts.status, "published"), lte(blogPosts.publishedAt, new Date()))).limit(1);
    return rows[0] ?? null;
  }
  return memory().posts.find((post) => post.slug === decoded && post.status === "published" && post.publishedAt && post.publishedAt <= new Date()) ?? null;
}
