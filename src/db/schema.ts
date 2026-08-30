import {
  pgTable,
  text,
  serial,
  bigint,
  boolean,
  integer,
  jsonb,
  timestamp,
} from "drizzle-orm/pg-core";

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  subtitle: text("subtitle").notNull().default(""),
  description: text("description").notNull().default(""),
  features: jsonb("features").$type<string[]>().notNull().default([]),
  contents: jsonb("contents").$type<string[]>().notNull().default([]),
  price: bigint("price", { mode: "number" }).notNull().default(0),
  unitPrice: text("unit_price").notNull().default(""),
  category: text("category").notNull().default("foam"),
  categoryLabel: text("category_label").notNull().default(""),
  images: jsonb("images").$type<string[]>().notNull().default([]),
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

export type OrderItem = {
  productId: number;
  productName: string;
  productImage: string;
  price: number;
  unitPrice?: string;
  quantity: number;
};

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  trackingCode: text("tracking_code").notNull().unique(),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  customerAddress: text("customer_address").notNull(),
  customerProvince: text("customer_province").notNull().default(""),
  customerCity: text("customer_city").notNull().default(""),
  postalCode: text("postal_code").notNull().default(""),
  notes: text("notes").notNull().default(""),
  items: jsonb("items").$type<OrderItem[]>().notNull().default([]),
  totalAmount: bigint("total_amount", { mode: "number" }).notNull().default(0),
  status: text("status").notNull().default("pending"), // pending | processing | shipped | delivered | cancelled
  shippingCode: text("shipping_code").notNull().default(""),
  trackingLink: text("tracking_link").notNull().default(""),
  adminNotes: text("admin_notes").notNull().default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type ProductRow = typeof products.$inferSelect;
export type OrderRow = typeof orders.$inferSelect;
