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

export type ProductRow = typeof products.$inferSelect;
