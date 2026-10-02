-- Backward-compatible schema additions for retail/wholesale commerce, customer accounts, and verified payment integration

-- 1. Customer Accounts Table
CREATE TABLE IF NOT EXISTS customer_users (
  id serial PRIMARY KEY,
  phone text NOT NULL,
  name text NOT NULL DEFAULT '',
  province text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  postal_code text NOT NULL DEFAULT '',
  company_name text NOT NULL DEFAULT '',
  is_wholesale boolean NOT NULL DEFAULT false,
  password_hash text,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS customer_users_phone_unique_idx ON customer_users (phone);

-- 2. Products table extensions for dual pricing, wholesale tiers, and media
ALTER TABLE products ADD COLUMN IF NOT EXISTS retail_price bigint NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS wholesale_price bigint NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS wholesale_min_qty integer NOT NULL DEFAULT 1;
ALTER TABLE products ADD COLUMN IF NOT EXISTS wholesale_tiers jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_retail boolean NOT NULL DEFAULT true;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_wholesale boolean NOT NULL DEFAULT true;
ALTER TABLE products ADD COLUMN IF NOT EXISTS video_url text NOT NULL DEFAULT '';

-- Preserve current production prices for all pre-existing product rows.
UPDATE products SET retail_price = price WHERE retail_price = 0 AND price > 0;
UPDATE products SET wholesale_price = price WHERE wholesale_price = 0 AND price > 0;

-- 3. Orders table extensions for customer linking, order type, and payment tracking
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_id integer;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_type text NOT NULL DEFAULT 'retail';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'pending';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method text NOT NULL DEFAULT 'online';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_link text NOT NULL DEFAULT '';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_ref_id text NOT NULL DEFAULT '';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_track_id text NOT NULL DEFAULT '';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_at timestamp;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'orders_customer_id_customer_users_id_fk'
      AND conrelid = 'orders'::regclass
  ) THEN
    ALTER TABLE orders
      ADD CONSTRAINT orders_customer_id_customer_users_id_fk
      FOREIGN KEY (customer_id) REFERENCES customer_users(id)
      ON DELETE RESTRICT NOT VALID;
  END IF;
END $$;

ALTER TABLE orders VALIDATE CONSTRAINT orders_customer_id_customer_users_id_fk;

-- 4. Fast lookup indexes
CREATE INDEX IF NOT EXISTS orders_customer_id_idx ON orders (customer_id);
CREATE INDEX IF NOT EXISTS orders_payment_status_idx ON orders (payment_status);
CREATE INDEX IF NOT EXISTS orders_order_type_idx ON orders (order_type);
CREATE INDEX IF NOT EXISTS orders_payment_track_id_idx ON orders (payment_track_id);
