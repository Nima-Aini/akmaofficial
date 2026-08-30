import { db } from "@/db";
import { adminUsers, orders, products, settings, type OrderItem, type OrderRow, type ProductRow } from "@/db/schema";
import { asc, desc, eq, or } from "drizzle-orm";
import { DEFAULT_ADMIN, DEFAULT_SETTINGS, PRODUCT_SEEDS } from "./defaults";
import { hashPassword } from "./auth";

type MemoryAdmin = {
  id: number;
  username: string;
  passwordHash: string;
};

const globalForStore = globalThis as typeof globalThis & {
  __memorySettings?: Map<string, unknown>;
  __memoryProducts?: ProductRow[];
  __memoryOrders?: OrderRow[];
  __memoryAdmins?: MemoryAdmin[];
  __memorySeeded?: boolean;
};

function getMemoryStore() {
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
      unitPrice: p.unitPrice,
      category: p.category,
      categoryLabel: p.categoryLabel,
      images: p.images,
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
            productImage: "/images/products/foam-box.png",
            price: 1200000,
            unitPrice: "هر عدد ۲۴۰٬۰۰۰ ت",
            quantity: 2,
          },
          {
            productId: 2,
            productName: "خوشبوکننده کفش آکما (بسته ۱۲ عددی)",
            productImage: "/images/products/deodorant-box.png",
            price: 960000,
            unitPrice: "هر عدد ۸۰٬۰۰۰ ت",
            quantity: 1,
          },
        ],
        totalAmount: 3360000,
        status: "shipped",
        shippingCode: "TPX-9823418293",
        trackingLink: "https://tipaxco.com/tracking?id=9823418293",
        adminNotes: "کد پیگیری تیپاکس ثبت و پیامک شد.",
        createdAt: new Date(Date.now() - 86400000 * 2),
        updatedAt: new Date(Date.now() - 86400000),
      },
    ];
  }
  if (!globalForStore.__memoryAdmins) {
    globalForStore.__memoryAdmins = [
      {
        id: 1,
        username: DEFAULT_ADMIN.username,
        passwordHash: hashPassword(DEFAULT_ADMIN.password),
      },
    ];
  }
  return {
    settings: globalForStore.__memorySettings,
    products: globalForStore.__memoryProducts,
    orders: globalForStore.__memoryOrders,
    admins: globalForStore.__memoryAdmins,
  };
}

export function getMemoryAdmins(): MemoryAdmin[] {
  return getMemoryStore().admins;
}

export function updateMemoryAdmin(username: string, newUsername: string, newPasswordHash?: string): boolean {
  const store = getMemoryStore();
  const admin = store.admins.find((a) => a.username === username);
  if (!admin) return false;
  admin.username = newUsername;
  if (newPasswordHash) {
    admin.passwordHash = newPasswordHash;
  }
  return true;
}

export async function ensureSeeded() {
  getMemoryStore();
  if (!db) return;
  if (globalForStore.__memorySeeded) return;
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
    globalForStore.__memorySeeded = true;
  } catch (e) {
    // DB not available, in-memory repository handles it
    console.warn("DB seed error (in-memory store will be used):", e);
  }
}

export async function getSettings<T = Record<string, unknown>>(): Promise<
  Record<string, unknown> & T
> {
  const memStore = getMemoryStore();
  const out: Record<string, unknown> = {};
  for (const [k, v] of memStore.settings.entries()) {
    out[k] = v;
  }
  if (db) {
    try {
      await ensureSeeded();
      const rows = await db.select().from(settings);
      for (const row of rows) {
        out[row.key] = row.value;
        memStore.settings.set(row.key, row.value);
      }
    } catch {
      // fall back to memory
    }
  }
  return out as Record<string, unknown> & T;
}

export async function getSetting<K = unknown>(key: string): Promise<K> {
  const all = await getSettings();
  return all[key] as K;
}

export async function saveSetting(key: string, value: unknown) {
  const memStore = getMemoryStore();
  memStore.settings.set(key, value);
  if (db) {
    try {
      await db
        .insert(settings)
        .values({ key, value, updatedAt: new Date() })
        .onConflictDoUpdate({
          target: settings.key,
          set: { value, updatedAt: new Date() },
        });
    } catch (e) {
      console.warn("Failed to persist setting to DB:", e);
    }
  }
}

export async function getAllProducts(): Promise<ProductRow[]> {
  const memStore = getMemoryStore();
  if (db) {
    try {
      await ensureSeeded();
      const rows = await db.select().from(products).orderBy(asc(products.sortOrder));
      if (rows && rows.length > 0) {
        globalForStore.__memoryProducts = rows;
        return rows;
      }
    } catch {
      // fall back to memory
    }
  }
  return [...memStore.products].sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function getActiveProducts(): Promise<ProductRow[]> {
  const all = await getAllProducts();
  return all.filter((p) => p.active);
}

export async function getProductBySlug(slug: string): Promise<ProductRow | null> {
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
  if (db) {
    try {
      await ensureSeeded();
      const allRows: ProductRow[] = await db.select().from(products);
      const match = allRows.find(
        (p: ProductRow) =>
          p.slug === raw ||
          p.slug === decoded ||
          (Boolean(p.slug) && decodeURIComponent(p.slug) === decoded) ||
          (Boolean(p.slug) && decodeURIComponent(p.slug).toLowerCase() === decoded.toLowerCase()) ||
          (isNum && p.id === numericId)
      );
      if (match) return match;
    } catch {
      // fall back to memory
    }
  }

  return (
    memStore.products.find(
      (p: ProductRow) =>
        p.slug === raw ||
        p.slug === decoded ||
        (Boolean(p.slug) && decodeURIComponent(p.slug) === decoded) ||
        (Boolean(p.slug) && decodeURIComponent(p.slug).toLowerCase() === decoded.toLowerCase()) ||
        (isNum && p.id === numericId)
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
  const memStore = getMemoryStore();
  if (db) {
    try {
      const rows = await db.insert(products).values(input).returning();
      if (rows[0]) {
        memStore.products.push(rows[0]);
        return rows[0];
      }
    } catch (e) {
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
  const memStore = getMemoryStore();
  let updatedRow: ProductRow | null = null;
  if (db) {
    try {
      const rows = await db
        .update(products)
        .set(input)
        .where(eq(products.id, id))
        .returning();
      if (rows[0]) {
        updatedRow = rows[0];
      }
    } catch (e) {
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
  const memStore = getMemoryStore();
  if (db) {
    try {
      await db.delete(products).where(eq(products.id, id));
    } catch (e) {
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

/* ---------------- Orders Management ---------------- */

export type OrderInput = {
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerProvince?: string;
  customerCity?: string;
  postalCode?: string;
  notes?: string;
  items: OrderItem[];
  totalAmount: number;
};

export function generateTrackingCode(): string {
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `AKM-${rand}`;
}

export async function createOrder(input: OrderInput): Promise<OrderRow> {
  const memStore = getMemoryStore();
  const trackingCode = generateTrackingCode();
  const now = new Date();

  const newOrderData = {
    trackingCode,
    customerName: input.customerName.trim(),
    customerPhone: input.customerPhone.trim(),
    customerAddress: input.customerAddress.trim(),
    customerProvince: (input.customerProvince ?? "").trim(),
    customerCity: (input.customerCity ?? "").trim(),
    postalCode: (input.postalCode ?? "").trim(),
    notes: (input.notes ?? "").trim(),
    items: input.items,
    totalAmount: input.totalAmount,
    status: "pending",
    shippingCode: "",
    trackingLink: "",
    adminNotes: "",
    createdAt: now,
    updatedAt: now,
  };

  if (db) {
    try {
      const rows = await db.insert(orders).values(newOrderData).returning();
      if (rows[0]) {
        memStore.orders.unshift(rows[0]);
        return rows[0];
      }
    } catch (e) {
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
  const memStore = getMemoryStore();
  if (db) {
    try {
      const rows = await db.select().from(orders).orderBy(desc(orders.createdAt));
      if (rows && rows.length > 0) {
        globalForStore.__memoryOrders = rows;
        return rows;
      }
    } catch {
      // fallback to memory
    }
  }
  return [...memStore.orders].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function getOrderById(id: number): Promise<OrderRow | null> {
  const memStore = getMemoryStore();
  if (db) {
    try {
      const rows = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
      if (rows[0]) return rows[0];
    } catch {
      // fallback
    }
  }
  return memStore.orders.find((o) => o.id === id) ?? null;
}

export async function getOrderByTrackingCode(
  codeOrPhone: string,
): Promise<OrderRow | null> {
  const query = codeOrPhone.trim().toUpperCase();
  const rawQuery = codeOrPhone.trim();
  const memStore = getMemoryStore();

  if (db) {
    try {
      const rows = await db
        .select()
        .from(orders)
        .where(
          or(
            eq(orders.trackingCode, query),
            eq(orders.customerPhone, rawQuery),
            eq(orders.shippingCode, rawQuery),
          ),
        )
        .orderBy(desc(orders.createdAt))
        .limit(1);
      if (rows[0]) return rows[0];
    } catch {
      // fallback
    }
  }

  return (
    memStore.orders.find(
      (o) =>
        o.trackingCode.toUpperCase() === query ||
        o.customerPhone === rawQuery ||
        (o.shippingCode && o.shippingCode === rawQuery),
    ) ?? null
  );
}

export async function updateOrder(
  id: number,
  patch: Partial<OrderRow>,
): Promise<OrderRow | null> {
  const memStore = getMemoryStore();
  const updatedPatch = { ...patch, updatedAt: new Date() };
  let updatedRow: OrderRow | null = null;

  if (db) {
    try {
      const rows = await db
        .update(orders)
        .set(updatedPatch)
        .where(eq(orders.id, id))
        .returning();
      if (rows[0]) updatedRow = rows[0];
    } catch (e) {
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
  const memStore = getMemoryStore();
  if (db) {
    try {
      await db.delete(orders).where(eq(orders.id, id));
    } catch (e) {
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

