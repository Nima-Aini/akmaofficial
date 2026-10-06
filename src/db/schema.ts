import {
  pgTable,
  text,
  serial,
  bigint,
  boolean,
  integer,
  jsonb,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import type { TextRegionPosition } from "@/lib/text-region";

export type WholesaleTier = {
  minQty: number;
  price: number;
  label?: string;
};

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  subtitle: text("subtitle").notNull().default(""),
  description: text("description").notNull().default(""),
  features: jsonb("features").$type<string[]>().notNull().default([]),
  contents: jsonb("contents").$type<string[]>().notNull().default([]),
  price: bigint("price", { mode: "number" }).notNull().default(0),
  retailPrice: bigint("retail_price", { mode: "number" }).notNull().default(0),
  retailUnitLabel: text("retail_unit_label").notNull().default("عدد"),
  wholesalePrice: bigint("wholesale_price", { mode: "number" }).notNull().default(0),
  wholesaleMinQty: integer("wholesale_min_qty").notNull().default(1),
  wholesalePackSize: integer("wholesale_pack_size"),
  wholesalePackLabel: text("wholesale_pack_label").notNull().default(""),
  wholesaleMinPackQty: integer("wholesale_min_pack_qty"),
  wholesaleTiers: jsonb("wholesale_tiers").$type<WholesaleTier[]>().notNull().default([]),
  isRetail: boolean("is_retail").notNull().default(true),
  isWholesale: boolean("is_wholesale").notNull().default(true),
  videoUrl: text("video_url").notNull().default(""),
  unitPrice: text("unit_price").notNull().default(""),
  category: text("category").notNull().default("foam"),
  categoryLabel: text("category_label").notNull().default(""),
  images: jsonb("images").$type<string[]>().notNull().default([]),
  retailImages: jsonb("retail_images").$type<string[]>().notNull().default([]),
  wholesaleImages: jsonb("wholesale_images").$type<string[]>().notNull().default([]),
  cardTextRegionPosition: text("card_text_region_position").$type<TextRegionPosition>().notNull().default("bottom"),
  badge: text("badge").notNull().default(""),
  inStock: boolean("in_stock").notNull().default(true),
  featured: boolean("featured").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const adminUsers = pgTable("admin_users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const customerUsers = pgTable("customer_users", {
  id: serial("id").primaryKey(),
  phone: text("phone").notNull().unique(),
  name: text("name").notNull().default(""),
  province: text("province").notNull().default(""),
  city: text("city").notNull().default(""),
  address: text("address").notNull().default(""),
  postalCode: text("postal_code").notNull().default(""),
  companyName: text("company_name").notNull().default(""),
  isWholesale: boolean("is_wholesale").notNull().default(false),
  passwordHash: text("password_hash"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const customerOtps = pgTable("customer_otps", {
  phone: text("phone").primaryKey(),
  otpHash: text("otp_hash").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  attemptCount: integer("attempt_count").notNull().default(0),
  lastRequestedAt: timestamp("last_requested_at").notNull().defaultNow(),
  hourlyRequestCount: integer("hourly_request_count").notNull().default(1),
  hourWindowStart: timestamp("hour_window_start").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type OrderItem = {
  productId: number;
  productName: string;
  productImage: string;
  price: number;
  unitPrice?: string;
  quantity: number;
  mode?: "retail" | "wholesale";
  tierLabel?: string;
  selectedQuantity?: number;
  unitOrPackPrice?: number;
  packCount?: number;
  unitsPerPack?: number;
  totalUnits?: number;
  retailUnitLabel?: string;
  wholesalePackLabel?: string;
  appliedPricingTier?: string;
  lineTotal?: number;
};

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  trackingCode: text("tracking_code").notNull().unique(),
  customerId: integer("customer_id").references(() => customerUsers.id, { onDelete: "restrict" }),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  customerAddress: text("customer_address").notNull(),
  customerProvince: text("customer_province").notNull().default(""),
  customerCity: text("customer_city").notNull().default(""),
  postalCode: text("postal_code").notNull().default(""),
  notes: text("notes").notNull().default(""),
  items: jsonb("items").$type<OrderItem[]>().notNull().default([]),
  totalAmount: bigint("total_amount", { mode: "number" }).notNull().default(0),
  orderType: text("order_type").notNull().default("retail"), // retail | wholesale
  status: text("status").notNull().default("pending"), // pending | processing | shipped | delivered | cancelled
  paymentStatus: text("payment_status").notNull().default("pending"), // pending | paid | failed
  paymentMethod: text("payment_method").notNull().default("online"), // online | card_to_card
  paymentLink: text("payment_link").notNull().default(""),
  paymentRefId: text("payment_ref_id").notNull().default(""),
  paymentTrackId: text("payment_track_id").notNull().default(""),
  paidAt: timestamp("paid_at"),
  shippingCode: text("shipping_code").notNull().default(""),
  trackingLink: text("tracking_link").notNull().default(""),
  adminNotes: text("admin_notes").notNull().default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const paymentAttempts = pgTable(
  "payment_attempts",
  {
    id: serial("id").primaryKey(),
    orderId: integer("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "restrict" }),
    provider: text("provider").notNull().default("zibal"),
    trackId: text("track_id").notNull(),
    amount: bigint("amount", { mode: "number" }).notNull().default(0),
    amountRials: bigint("amount_rials", { mode: "number" }).notNull().default(0),
    status: text("status").notNull().default("pending"), // pending | paid | failed | superseded | duplicate_paid
    paymentLink: text("payment_link").notNull().default(""),
    verifiedRef: text("verified_ref").notNull().default(""),
    rawGatewayResponse: jsonb("raw_gateway_response").$type<Record<string, unknown>>().default({}),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("payment_attempts_provider_track_id_idx").on(table.provider, table.trackId),
  ],
);

export const cartProductSuggestions = pgTable(
  "cart_product_suggestions",
  {
    id: serial("id").primaryKey(),
    triggerProductId: integer("trigger_product_id").references(() => products.id, {
      onDelete: "set null",
    }),
    suggestedProductId: integer("suggested_product_id").references(() => products.id, {
      onDelete: "set null",
    }),
    message: text("message").notNull().default(""),
    active: boolean("active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("cart_product_suggestions_pair_unique_idx").on(
      table.triggerProductId,
      table.suggestedProductId,
    ),
  ],
);

export type BlogContentBlock = {
  id: string;
  type: "paragraph" | "h2" | "h3" | "bulletList" | "numberedList" | "quote" | "image" | "divider";
  text?: string;
  items?: string[];
  url?: string;
  alt?: string;
  caption?: string;
};

export const blogPosts = pgTable("blog_posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  excerpt: text("excerpt").notNull().default(""),
  coverImage: text("cover_image").notNull().default(""),
  coverImageAlt: text("cover_image_alt").notNull().default(""),
  content: jsonb("content").$type<BlogContentBlock[]>().notNull().default([]),
  seoTitle: text("seo_title").notNull().default(""),
  metaDescription: text("meta_description").notNull().default(""),
  status: text("status").notNull().default("draft"),
  author: text("author").notNull().default(""),
  featured: boolean("featured").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type ProductRow = typeof products.$inferSelect;
export type CustomerUserRow = typeof customerUsers.$inferSelect;
export type CustomerOtpRow = typeof customerOtps.$inferSelect;
export type OrderRow = typeof orders.$inferSelect;
export type PaymentAttemptRow = typeof paymentAttempts.$inferSelect;
export type CartProductSuggestionRow = typeof cartProductSuggestions.$inferSelect;
export type BlogPostRow = typeof blogPosts.$inferSelect;
