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
import { toEnDigits } from "./format";

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
  orderId: number;
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
      badge: p.badge,
      inStock: true,
      featured: p.featured,
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
        badge: p.badge,
        inStock: true,
        featured: p.featured,
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
      const rows = await db!.select().from(products).orderBy(asc(products.sortOrder));
      if (rows) {
        globalForStore.__memoryProducts = rows;
        return rows;
      }
    } catch (e) {
      if (process.env.DATABASE_URL) {
        console.error("Failed to read products from DB:", e);
        throw new Error("خطا در دریافت لیست محصولات از پایگاه داده");
      }
    }
  }
  return [...memStore.products].sort((a, b) => a.sortOrder - b.sortOrder);
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

  const memStore = getMemoryStore();
  if (db || process.env.DATABASE_URL) {
    try {
      await ensureSeeded();
      const allRows: ProductRow[] = await db!.select().from(products);
      const match = allRows.find(
        (p: ProductRow) =>
          p.slug === raw ||
          p.slug === decoded ||
          (Boolean(p.slug) && decodeURIComponent(p.slug) === decoded) ||
          (Boolean(p.slug) && decodeURIComponent(p.slug).toLowerCase() === decoded.toLowerCase()) ||
          (isNum && p.id === numericId),
      );
      return match ?? null;
    } catch (e) {
      if (process.env.DATABASE_URL) {
        console.error("Failed to read product by slug from DB:", e);
        throw new Error("خطا در خواندن اطلاعات محصول از پایگاه داده");
      }
    }
  }

  return (
    memStore.products.find(
      (p: ProductRow) =>
        p.slug === raw ||
        p.slug === decoded ||
        (Boolean(p.slug) && decodeURIComponent(p.slug) === decoded) ||
        (Boolean(p.slug) && decodeURIComponent(p.slug).toLowerCase() === decoded.toLowerCase()) ||
        (isNum && p.id === numericId),
    ) ?? null
  );
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
  badge: string;
  inStock: boolean;
  featured: boolean;
  sortOrder: number;
  active: boolean;
};

export { calculateProductPricing } from "./pricing";

export async function createProduct(input: ProductInput): Promise<ProductRow> {
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
    Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
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
  const wholesalePrice = body.wholesalePrice !== undefined ? Math.max(0, Number(body.wholesalePrice) || 0) : price;

  return {
    name,
    slug: str(body.slug) ? slugify(str(body.slug)) : slugify(name),
    subtitle: str(body.subtitle),
    description: str(body.description),
    features: arr(body.features),
    contents: arr(body.contents),
    price,
    retailPrice,
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
    categoryLabel: str(body.categoryLabel) || "فوم تمیزکننده",
    images: arr(body.images),
    retailImages: arr(body.retailImages),
    wholesaleImages: arr(body.wholesaleImages),
    badge: str(body.badge),
    inStock: body.inStock !== false,
    featured: body.featured === true,
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

export type OrderInput = {
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerProvince?: string;
  customerCity?: string;
  postalCode?: string;
  notes?: string;
  items: OrderItem[];
  totalAmount?: number;
  orderType?: "retail" | "wholesale";
  customerId?: number | null;
  paymentMethod?: "online" | "card_to_card";
  paymentLink?: string;
  paymentRefId?: string;
  paymentTrackId?: string;
};

export function generateTrackingCode(): string {
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `AKM-${rand}`;
}

export async function createOrder(input: OrderInput): Promise<OrderRow> {
  if (!db) assertMemoryStoreAllowed("order creation");
  const memStore = getMemoryStore();
  const trackingCode = generateTrackingCode();
  const now = new Date();

  const safeItems = input.items.map((it) => ({
    ...it,
    price: Math.max(0, Number(it.price) || 0),
    quantity: Math.max(1, Number(it.quantity) || 1),
    mode: it.mode || input.orderType || "retail",
  }));
  const calcTotal = safeItems.reduce((acc, it) => acc + it.price * it.quantity, 0);
  const totalAmount = input.totalAmount && input.totalAmount > 0 ? input.totalAmount : calcTotal;
  const paymentLink = input.paymentLink || "";

  const newOrderData = {
    trackingCode,
    customerId: input.customerId ?? null,
    orderType: input.orderType || "retail",
    customerName: input.customerName.trim(),
    customerPhone: input.customerPhone.trim(),
    customerAddress: input.customerAddress.trim(),
    customerProvince: (input.customerProvince ?? "").trim(),
    customerCity: (input.customerCity ?? "").trim(),
    postalCode: (input.postalCode ?? "").trim(),
    notes: (input.notes ?? "").trim(),
    items: safeItems,
    totalAmount,
    status: "pending",
    paymentStatus: "pending",
    paymentMethod: input.paymentMethod || "online",
    paymentLink,
    paymentRefId: input.paymentRefId || "",
    paymentTrackId: input.paymentTrackId || "",
    paidAt: null,
    shippingCode: "",
    trackingLink: "",
    adminNotes: "",
    createdAt: now,
    updatedAt: now,
  };

  if (db || process.env.DATABASE_URL) {
    try {
      const rows = await db!.insert(orders).values(newOrderData).returning();
      if (rows[0]) {
        memStore.orders.unshift(rows[0]);
        return rows[0];
      }
    } catch (e) {
      if (process.env.DATABASE_URL) {
        console.error("Failed to create order in DB:", e);
        throw new Error("خطا در ثبت سفارش در پایگاه داده");
      }
      console.warn("Failed to create order in DB, using memory store:", e);
    }
  }

  const nextId =
    memStore.orders.length > 0
      ? Math.max(...memStore.orders.map((o) => o.id)) + 1
      : 1;

  const orderRow: OrderRow = {
    id: nextId,
    ...newOrderData,
  };
  memStore.orders.unshift(orderRow);
  return orderRow;
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
