/**
 * Akma Official - Primary Data & Settings Store
 * Interacts with PostgreSQL database when DATABASE_URL is set.
 * Explicitly fails without falling back to sample memory data in production.
 */

import crypto from "node:crypto";
import { assertMemoryStoreAllowed, db } from "@/db";
import {
  orders,
  products,
  settings,
  type OrderRow,
  type ProductRow,
  type OrderItem,
} from "@/db/schema";
import { asc, desc, eq, or } from "drizzle-orm";
import { DEFAULT_SETTINGS, PRODUCT_SEEDS } from "./defaults";
import { resolveProductCategoryLabel, type CategoryDefinition } from "./product-category";
import { toEnDigits } from "./format";
import { normalizeFocalPoint, sanitizeImageUrl, type ImageFocalPoint } from "./responsive-image";
import { sanitizeRichTextMap, type RichTextMap } from "./rich-text";

const globalForStore = globalThis as typeof globalThis & {
  __memorySettings?: Map<string, unknown>;
  __memoryProducts?: ProductRow[];
  __memoryOrders?: OrderRow[];
  __memoryAdmins?: MemoryAdmin[];
  __memoryPaymentAttempts?: MemoryPaymentAttempt[];
  __memorySeeded?: boolean;
};

export type MemoryPaymentAttempt = {
  id: number;
  orderId: number | null;
  checkoutIntentId?: string | null;
  provider: string;
  trackId: string;
  amount: number;
  amountRials: number;
  status: "pending" | "paid" | "failed" | "superseded" | "duplicate_paid";
  paymentLink: string;
  verifiedRef: string;
  rawGatewayResponse?: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
};

export type MemoryAdmin = {
  id: number;
  username: string;
  passwordHash: string;
};

export function hashPassword(str: string): string {
  return crypto.createHash("sha256").update(`akma_salt_${str}`).digest("hex");
}

export function getMemoryStore() {
  if (!globalForStore.__memorySettings) {
    globalForStore.__memorySettings = new Map(Object.entries(DEFAULT_SETTINGS));
  }
  if (!globalForStore.__memoryProducts) {
    globalForStore.__memoryProducts = PRODUCT_SEEDS.map((p, idx) => ({
      id: idx + 1,
      name: p.name,
      slug: p.slug,
      subtitle: p.subtitle,
      description: p.description,
      features: p.features,
      contents: p.contents,
      price: p.price,
      retailPrice: p.retailPrice ?? p.price,
      retailOldPrice: null,
      retailUnitLabel: p.retailUnitLabel ?? "عدد",
      wholesalePrice: p.wholesalePrice ?? p.price,
      wholesaleMinQty: p.wholesaleMinQty ?? 1,
      wholesalePackSize: p.wholesalePackSize ?? null,
      wholesalePackLabel: p.wholesalePackLabel ?? "",
      wholesaleMinPackQty: p.wholesaleMinPackQty ?? null,
      wholesaleTiers: p.wholesaleTiers ?? [],
      isRetail: p.isRetail !== false,
      isWholesale: p.isWholesale !== false,
      videoUrl: "",
      unitPrice: p.unitPrice,
      category: p.category,
      categoryLabel: p.categoryLabel,
      images: p.images,
      retailImages: p.retailImages ?? [],
      wholesaleImages: p.wholesaleImages ?? [],
      retailMobileImages: p.retailMobileImages ?? [],
      wholesaleMobileImages: p.wholesaleMobileImages ?? [],
      desktopObjectPosition: p.desktopObjectPosition ?? { x: 50, y: 50 },
      mobileObjectPosition: p.mobileObjectPosition ?? { x: 50, y: 50 },
      textFormatting: p.textFormatting ?? {},
      cardTextRegionPosition: p.cardTextRegionPosition ?? "bottom",
      badge: p.badge,
      inStock: true,
      featured: p.featured,
      featuredRetail: p.featured,
      featuredWholesale: false,
      retailFeaturedOrder: p.sortOrder,
      wholesaleFeaturedOrder: 0,
      sortOrder: p.sortOrder,
      active: true,
      createdAt: new Date(),
    }));
  }
  if (!globalForStore.__memoryOrders) {
    globalForStore.__memoryOrders = [
      {
        id: 1,
        trackingCode: "AKM-849201",
        customerId: 1,
        orderType: "wholesale",
        customerName: "فروشگاه اسپرت رضایی",
        customerPhone: "09123456789",
        customerAddress: "تهران، میدان منیریه، پاساژ کاوه، پلاک ۲۴",
        customerProvince: "تهران",
        customerCity: "تهران",
        postalCode: "1193645123",
        notes: "لطفاً با تیپاکس ارسال شود",
        items: [
          {
            productId: 1,
            productName: "فوم تمیزکننده کفش آکما (بسته ۵ عددی)",
            productImage: "/images/redesign/cat-foam.jpg",
            price: 1200000,
            unitPrice: "هر عدد ۲۴۰٬۰۰۰ ت",
            quantity: 2,
            mode: "wholesale",
            tierLabel: "قیمت همکاری",
            selectedQuantity: 2,
            unitOrPackPrice: 1200000,
            packCount: 2,
            unitsPerPack: 1,
            totalUnits: 2,
            wholesalePackLabel: "بسته",
            appliedPricingTier: "قیمت همکاری",
            lineTotal: 2400000,
          },
        ],
        totalAmount: 3360000,
        status: "shipped",
        paymentStatus: "paid",
        paymentMethod: "online",
        paymentLink: "",
        paymentRefId: "REF-9920194",
        paymentTrackId: "TRACK-9920194",
        paidAt: new Date(Date.now() - 86400000),
        shippingCode: "TPX-9823418293",
        trackingLink: "https://tipaxco.com/tracking?id=9823418293",
        adminNotes: "کد پیگیری تیپاکس ثبت و پیامک شد.",
        createdAt: new Date(Date.now() - 86400000 * 2),
        updatedAt: new Date(Date.now() - 86400000),
      },
    ];
  }
  if (!globalForStore.__memoryAdmins) {
    const username = process.env.ADMIN_USERNAME?.trim() || "admin";
    const password = process.env.ADMIN_PASSWORD || "admin123";
    globalForStore.__memoryAdmins = [
      { id: 1, username, passwordHash: hashPassword(password) },
    ];
  }
  if (!globalForStore.__memoryPaymentAttempts) {
    globalForStore.__memoryPaymentAttempts = [];
  }
  return {
    settings: globalForStore.__memorySettings!,
    products: globalForStore.__memoryProducts!,
    orders: globalForStore.__memoryOrders!,
    admins: globalForStore.__memoryAdmins!,
    paymentAttempts: globalForStore.__memoryPaymentAttempts!,
  };
}

export function getMemoryPaymentAttempts(): MemoryPaymentAttempt[] {
  return getMemoryStore().paymentAttempts;
}

export function getMemoryAdmins(): MemoryAdmin[] {
  return getMemoryStore().admins;
}

export function updateMemoryAdmin(username: string, newUsername: string, newPasswordHash?: string): boolean {
  const store = getMemoryStore();
  const idx = store.admins.findIndex((a) => a.username === username);
  if (idx === -1) return false;
  store.admins[idx].username = newUsername;
  if (newPasswordHash) store.admins[idx].passwordHash = newPasswordHash;
  return true;
}

export async function ensureSeeded() {
  if (!db) {
    assertMemoryStoreAllowed("store seeding");
    return;
  }
  if (globalForStore.__memorySeeded) return;
  try {
    globalForStore.__memorySeeded = true;
    const existingProducts = await db.select().from(products).limit(1);
    if (existingProducts.length === 0) {
      const seedRows = PRODUCT_SEEDS.map((p, idx) => ({
        name: p.name,
        slug: p.slug,
        subtitle: p.subtitle,
        description: p.description,
        features: p.features,
        contents: p.contents,
        price: p.price,
        retailPrice: p.retailPrice ?? p.price,
        retailOldPrice: null,
        retailUnitLabel: p.retailUnitLabel ?? "عدد",
        wholesalePrice: p.wholesalePrice ?? p.price,
        wholesaleMinQty: p.wholesaleMinQty ?? 1,
        wholesalePackSize: p.wholesalePackSize ?? null,
        wholesalePackLabel: p.wholesalePackLabel ?? "",
        wholesaleMinPackQty: p.wholesaleMinPackQty ?? null,
        wholesaleTiers: p.wholesaleTiers ?? [],
        isRetail: p.isRetail !== false,
        isWholesale: p.isWholesale !== false,
        videoUrl: "",
        unitPrice: p.unitPrice,
        category: p.category,
        categoryLabel: p.categoryLabel,
        images: p.images,
        retailImages: p.retailImages ?? [],
        wholesaleImages: p.wholesaleImages ?? [],
        retailMobileImages: p.retailMobileImages ?? [],
        wholesaleMobileImages: p.wholesaleMobileImages ?? [],
        desktopObjectPosition: p.desktopObjectPosition ?? { x: 50, y: 50 },
        mobileObjectPosition: p.mobileObjectPosition ?? { x: 50, y: 50 },
        textFormatting: p.textFormatting ?? {},
        cardTextRegionPosition: p.cardTextRegionPosition ?? "bottom",
        badge: p.badge,
        inStock: true,
        featured: p.featured,
        featuredRetail: p.featured,
        featuredWholesale: false,
        retailFeaturedOrder: p.sortOrder,
        wholesaleFeaturedOrder: 0,
        sortOrder: p.sortOrder,
        active: true,
      }));
      await db.insert(products).values(seedRows);
    }

    const existingSettings = await db.select().from(settings).limit(1);
    if (existingSettings.length === 0) {
      const settingEntries = Object.entries(DEFAULT_SETTINGS).map(([k, v]) => ({
        key: k,
        value: v,
      }));
      await db.insert(settings).values(settingEntries);
    }
  } catch (e) {
    globalForStore.__memorySeeded = false;
    console.error("DB seed error:", e);
    throw new Error("خطا در آماده‌سازی داده‌های پایه در پایگاه داده");
  }
}

export async function getSettings<T = Record<string, unknown>>(): Promise<
  Record<string, unknown> & T
> {
  if (!db) assertMemoryStoreAllowed("settings reads");
  const memStore = getMemoryStore();
  const out: Record<string, unknown> = {};
  for (const [k, v] of memStore.settings.entries()) {
    out[k] = v;
  }

  if (db || process.env.DATABASE_URL) {
    try {
      await ensureSeeded();
      const rows = await db!.select().from(settings);
      for (const row of rows) {
        out[row.key] = row.value;
        memStore.settings.set(row.key, row.value);
      }
      return out as Record<string, unknown> & T;
    } catch (e) {
      if (process.env.DATABASE_URL) {
        console.error("Failed to read settings from DB:", e);
        throw new Error("خطا در خواندن تنظیمات از پایگاه داده");
      }
    }
  }

  return out as Record<string, unknown> & T;
}

export async function getSetting<K = unknown>(key: string): Promise<K> {
  const all = await getSettings();
  return all[key] as K;
}

export async function saveSetting(key: string, value: unknown) {
  if (!db) assertMemoryStoreAllowed("settings writes");
  const memStore = getMemoryStore();
  memStore.settings.set(key, value);

  if (db || process.env.DATABASE_URL) {
    try {
      await db!
        .insert(settings)
        .values({ key, value, updatedAt: new Date() })
        .onConflictDoUpdate({
          target: settings.key,
          set: { value, updatedAt: new Date() },
        });
    } catch (e) {
      if (process.env.DATABASE_URL) {
        console.error("Failed to persist setting to DB:", e);
        throw new Error(`خطا در ذخیره تنظیمات «${key}» در پایگاه داده`);
      }
      console.warn("Failed to persist setting to DB:", e);
    }
  }
}

export async function getAllProducts(): Promise<ProductRow[]> {
  if (!db) assertMemoryStoreAllowed("product reads");
  const memStore = getMemoryStore();
  if (db || process.env.DATABASE_URL) {
    try {
      await ensureSeeded();
      const rows: ProductRow[] = await db!.select().from(products).orderBy(asc(products.sortOrder));
      if (rows) {
        globalForStore.__memoryProducts = rows;
        const site = await getSettings();
        return rows.map((p) => ({ ...p, categoryLabel: resolveProductCategoryLabel(p.category, site.categories as CategoryDefinition[], p.categoryLabel) }));
      }
    } catch (e) {
      if (process.env.DATABASE_URL) {
        console.error("Failed to read products from DB:", e);
        throw new Error("خطا در دریافت لیست محصولات از پایگاه داده");
      }
    }
  }
  const site = await getSettings();
  return [...memStore.products].sort((a, b) => a.sortOrder - b.sortOrder).map((p) => ({ ...p, categoryLabel: resolveProductCategoryLabel(p.category, site.categories as CategoryDefinition[], p.categoryLabel) }));
}

export async function getActiveProducts(): Promise<ProductRow[]> {
  const all = await getAllProducts();
  return all.filter((p) => p.active);
}

export async function getProductBySlug(slug: string): Promise<ProductRow | null> {
  if (!db) assertMemoryStoreAllowed("product lookup");
  if (!slug) return null;
  const raw = String(slug).trim();
  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    decoded = raw;
  }
  const numericId = Number(raw);
  const isNum = !isNaN(numericId) && numericId > 0;

  const allRows = await getAllProducts();
  return allRows.find(
    (p) => p.slug === raw || p.slug === decoded ||
      (Boolean(p.slug) && decodeURIComponent(p.slug).toLowerCase() === decoded.toLowerCase()) ||
      (isNum && p.id === numericId),
  ) ?? null;

}

export type ProductInput = {
  name: string;
  slug: string;
  subtitle: string;
  description: string;
  features: string[];
  contents: string[];
  price: number;
  retailPrice: number;
  retailOldPrice: number | null;
  retailUnitLabel: string;
  wholesalePrice: number;
  wholesaleMinQty: number;
  wholesalePackSize: number | null;
  wholesalePackLabel: string;
  wholesaleMinPackQty: number | null;
  wholesaleTiers: { minQty: number; price: number; label?: string }[];
  isRetail: boolean;
  isWholesale: boolean;
  videoUrl: string;
  unitPrice: string;
  category: string;
  categoryLabel: string;
  images: string[];
  retailImages: string[];
  wholesaleImages: string[];
  retailMobileImages: string[];
  wholesaleMobileImages: string[];
  desktopObjectPosition: ImageFocalPoint;
  mobileObjectPosition: ImageFocalPoint;
  textFormatting: RichTextMap;
  cardTextRegionPosition: "right" | "left" | "bottom" | "center";
  badge: string;
  inStock: boolean;
  featured: boolean;
  featuredRetail: boolean;
  featuredWholesale: boolean;
  retailFeaturedOrder: number;
  wholesaleFeaturedOrder: number;
  sortOrder: number;
  active: boolean;
};

export { calculateProductPricing } from "./pricing";

export async function createProduct(input: ProductInput): Promise<ProductRow> {
  input = { ...input, categoryLabel: resolveProductCategoryLabel(input.category, (await getSettings()).categories as CategoryDefinition[], input.categoryLabel) };
  if (!db) assertMemoryStoreAllowed("product creation");
  const memStore = getMemoryStore();
  if (db || process.env.DATABASE_URL) {
    try {
      const rows = await db!.insert(products).values(input).returning();
      if (rows[0]) {
        memStore.products.push(rows[0]);
        return rows[0];
      }
    } catch (e) {
      if (process.env.DATABASE_URL) {
        console.error("Failed to create product in DB:", e);
        throw new Error("خطا در ایجاد محصول جدید در پایگاه داده");
      }
      console.warn("Failed to create product in DB, using memory store:", e);
    }
  }
  const nextId =
    memStore.products.length > 0
      ? Math.max(...memStore.products.map((p) => p.id)) + 1
      : 1;
  const newRow: ProductRow = {
    id: nextId,
    ...input,
    createdAt: new Date(),
  };
  memStore.products.push(newRow);
  return newRow;
}

export async function updateProduct(
  id: number,
  input: Partial<ProductInput>,
): Promise<ProductRow | null> {
  if (input.category) input = { ...input, categoryLabel: resolveProductCategoryLabel(input.category, (await getSettings()).categories as CategoryDefinition[], input.categoryLabel) };
  if (!db) assertMemoryStoreAllowed("product updates");
  const memStore = getMemoryStore();
  let updatedRow: ProductRow | null = null;
  if (db || process.env.DATABASE_URL) {
    try {
      const rows = await db!
        .update(products)
        .set(input)
        .where(eq(products.id, id))
        .returning();
      if (rows[0]) {
        updatedRow = rows[0];
        return rows[0];
      }
    } catch (e) {
      if (process.env.DATABASE_URL) {
        console.error("Failed to update product in DB:", e);
        throw new Error("خطا در به‌روزرسانی اطلاعات محصول در پایگاه داده");
      }
      console.warn("Failed to update product in DB:", e);
    }
  }
  const idx = memStore.products.findIndex((p) => p.id === id);
  if (idx !== -1) {
    memStore.products[idx] = {
      ...memStore.products[idx],
      ...input,
    };
    if (!updatedRow) updatedRow = memStore.products[idx];
  }
  return updatedRow;
}

export async function deleteProduct(id: number) {
  if (!db) assertMemoryStoreAllowed("product deletion");
  const memStore = getMemoryStore();
  if (db || process.env.DATABASE_URL) {
    try {
      await db!.delete(products).where(eq(products.id, id));
      return;
    } catch (e) {
      if (process.env.DATABASE_URL) {
        console.error("Failed to delete product in DB:", e);
        throw new Error("خطا در حذف محصول از پایگاه داده");
      }
      console.warn("Failed to delete product in DB:", e);
    }
  }
  const idx = memStore.products.findIndex((p) => p.id === id);
  if (idx !== -1) {
    memStore.products.splice(idx, 1);
  }
}

export function sanitizeProduct(body: Record<string, unknown>): ProductInput {
  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const arr = (v: unknown) =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === "string").map(sanitizeImageUrl).filter(Boolean).slice(0, 12) : [];
  const textArr = (v: unknown) =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === "string").map((x) => x.trim().slice(0, 2_000)).slice(0, 100) : [];
  const name = str(body.name) || "محصول بدون نام";
  const positiveIntOrNull = (value: unknown) => {
    if (value === null || value === undefined || value === "") return null;
    const number = Number(value);
    if (!Number.isSafeInteger(number) || number <= 0) throw new Error("مقدار بسته باید یک عدد صحیح مثبت باشد");
    return number;
  };
  const rawTiers = Array.isArray(body.wholesaleTiers)
    ? (body.wholesaleTiers as Array<{ minQty?: unknown; price?: unknown; label?: unknown }>).map((t) => ({
        minQty: positiveIntOrNull(t.minQty) ?? 1,
        price: Math.max(0, Number(t.price) || 0),
        label: typeof t.label === "string" ? t.label.trim() : undefined,
      }))
    : [];

  const price = Math.max(0, Number(body.price) || 0);
  const retailPrice = body.retailPrice !== undefined ? Math.max(0, Number(body.retailPrice) || 0) : price;
  const retailOldPrice = body.retailOldPrice === null || body.retailOldPrice === undefined || body.retailOldPrice === ""
    ? null : Number(body.retailOldPrice);
  if (retailOldPrice !== null && (!Number.isSafeInteger(retailOldPrice) || retailOldPrice <= retailPrice)) {
    throw new Error("قیمت قبلی باید عدد صحیح و بیشتر از قیمت فروش تکی باشد");
  }
  const wholesalePrice = body.wholesalePrice !== undefined ? Math.max(0, Number(body.wholesalePrice) || 0) : price;

  return {
    name,
    slug: str(body.slug) ? slugify(str(body.slug)) : slugify(name),
    subtitle: str(body.subtitle),
    description: str(body.description),
    features: textArr(body.features),
    contents: textArr(body.contents),
    price,
    retailPrice,
    retailOldPrice,
    retailUnitLabel: str(body.retailUnitLabel) || "عدد",
    wholesalePrice,
    wholesaleMinQty: Math.max(1, Number(body.wholesaleMinQty) || 1),
    wholesalePackSize: positiveIntOrNull(body.wholesalePackSize),
    wholesalePackLabel: str(body.wholesalePackLabel),
    wholesaleMinPackQty: positiveIntOrNull(body.wholesaleMinPackQty),
    wholesaleTiers: rawTiers,
    isRetail: body.isRetail !== false,
    isWholesale: body.isWholesale !== false,
    videoUrl: str(body.videoUrl),
    unitPrice: str(body.unitPrice),
    category: str(body.category) || "foam",
    categoryLabel: resolveProductCategoryLabel(str(body.category) || "foam", undefined, str(body.categoryLabel)),
    images: arr(body.images),
    retailImages: arr(body.retailImages),
    wholesaleImages: arr(body.wholesaleImages),
    retailMobileImages: arr(body.retailMobileImages),
    wholesaleMobileImages: arr(body.wholesaleMobileImages),
    desktopObjectPosition: normalizeFocalPoint(body.desktopObjectPosition),
    mobileObjectPosition: normalizeFocalPoint(body.mobileObjectPosition),
    textFormatting: sanitizeRichTextMap(body.textFormatting),
    cardTextRegionPosition: (() => {
      const value = str(body.cardTextRegionPosition);
      return value === "right" || value === "left" || value === "center" ? value : "bottom";
    })(),
    badge: str(body.badge),
    inStock: body.inStock !== false,
    featured: body.featured === true,
    featuredRetail: body.featuredRetail === true && body.isRetail !== false,
    featuredWholesale: body.featuredWholesale === true && body.isWholesale !== false,
    retailFeaturedOrder: Number.isSafeInteger(Number(body.retailFeaturedOrder)) ? Number(body.retailFeaturedOrder) : 0,
    wholesaleFeaturedOrder: Number.isSafeInteger(Number(body.wholesaleFeaturedOrder)) ? Number(body.wholesaleFeaturedOrder) : 0,
    sortOrder: Number(body.sortOrder) || 0,
    active: body.active !== false,
  };
}

export function slugify(text: string): string {
  const base = text
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\u0600-\u06FF-]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
  return base || `p-${Date.now()}`;
}

export async function getAllOrders(): Promise<OrderRow[]> {
  if (!db) assertMemoryStoreAllowed("order reads");
  const memStore = getMemoryStore();
  if (db || process.env.DATABASE_URL) {
    try {
      const rows = await db!.select().from(orders).orderBy(desc(orders.createdAt));
      if (rows) {
        globalForStore.__memoryOrders = rows;
        return rows;
      }
    } catch (e) {
      if (process.env.DATABASE_URL) {
        console.error("Failed to fetch orders from DB:", e);
        throw new Error("خطا در دریافت لیست سفارش‌ها از پایگاه داده");
      }
    }
  }
  return [...memStore.orders].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function getOrderById(id: number): Promise<OrderRow | null> {
  if (!db) assertMemoryStoreAllowed("order lookup");
  const memStore = getMemoryStore();
  if (db || process.env.DATABASE_URL) {
    try {
      const rows = await db!.select().from(orders).where(eq(orders.id, id)).limit(1);
      return rows[0] ?? null;
    } catch (e) {
      if (process.env.DATABASE_URL) {
        console.error("Failed to query order by ID from DB:", e);
        throw new Error("خطا در دریافت اطلاعات سفارش از پایگاه داده");
      }
    }
  }
  return memStore.orders.find((o) => o.id === id) ?? null;
}

export async function getOrderByTrackingCode(
  codeOrPhone: string,
): Promise<OrderRow | null> {
  if (!db) assertMemoryStoreAllowed("order tracking lookup");
  const normalized = toEnDigits(codeOrPhone).trim();
  const query = normalized.toUpperCase();
  const rawQuery = codeOrPhone.trim();
  const memStore = getMemoryStore();

  if (db || process.env.DATABASE_URL) {
    try {
      const rows = await db!
        .select()
        .from(orders)
        .where(
          or(
            eq(orders.trackingCode, query),
            eq(orders.customerPhone, normalized),
            eq(orders.customerPhone, rawQuery),
            eq(orders.shippingCode, normalized),
            eq(orders.shippingCode, rawQuery),
          ),
        )
        .orderBy(desc(orders.createdAt))
        .limit(1);
      return rows[0] ?? null;
    } catch (e) {
      if (process.env.DATABASE_URL) {
        console.error("Failed to query order by tracking code from DB:", e);
        throw new Error("خطا در رهگیری سفارش از پایگاه داده");
      }
    }
  }

  return (
    memStore.orders.find(
      (o) =>
        o.trackingCode.toUpperCase() === query ||
        o.customerPhone === normalized ||
        o.customerPhone === rawQuery ||
        (o.shippingCode && (o.shippingCode === normalized || o.shippingCode === rawQuery)),
    ) ?? null
  );
}

export async function updateOrder(
  id: number,
  patch: Partial<OrderRow>,
): Promise<OrderRow | null> {
  if (!db) assertMemoryStoreAllowed("order updates");
  const memStore = getMemoryStore();
  const updatedPatch = { ...patch, updatedAt: new Date() };
  let updatedRow: OrderRow | null = null;

  if (db || process.env.DATABASE_URL) {
    try {
      const rows = await db!
        .update(orders)
        .set(updatedPatch)
        .where(eq(orders.id, id))
        .returning();
      if (rows[0]) {
        updatedRow = rows[0];
        return rows[0];
      }
    } catch (e) {
      if (process.env.DATABASE_URL) {
        console.error("Failed to update order in DB:", e);
        throw new Error("خطا در به‌روزرسانی سفارش در پایگاه داده");
      }
      console.warn("Failed to update order in DB:", e);
    }
  }

  const idx = memStore.orders.findIndex((o) => o.id === id);
  if (idx !== -1) {
    memStore.orders[idx] = {
      ...memStore.orders[idx],
      ...updatedPatch,
    };
    if (!updatedRow) updatedRow = memStore.orders[idx];
  }

  return updatedRow;
}

export async function deleteOrder(id: number): Promise<boolean> {
  if (!db) assertMemoryStoreAllowed("order deletion");
  const memStore = getMemoryStore();
  if (db || process.env.DATABASE_URL) {
    try {
      await db!.delete(orders).where(eq(orders.id, id));
      return true;
    } catch (e) {
      if (process.env.DATABASE_URL) {
        console.error("Failed to delete order in DB:", e);
        throw new Error("خطا در حذف سفارش از پایگاه داده");
      }
      console.warn("Failed to delete order in DB:", e);
    }
  }
  const idx = memStore.orders.findIndex((o) => o.id === id);
  if (idx !== -1) {
    memStore.orders.splice(idx, 1);
    return true;
  }
  return false;
}
