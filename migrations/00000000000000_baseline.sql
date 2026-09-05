CREATE TABLE IF NOT EXISTS products (
  id serial PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL,
  subtitle text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  contents jsonb NOT NULL DEFAULT '[]'::jsonb,
  price bigint NOT NULL DEFAULT 0,
  unit_price text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'foam',
  category_label text NOT NULL DEFAULT '',
  images jsonb NOT NULL DEFAULT '[]'::jsonb,
  badge text NOT NULL DEFAULT '',
  in_stock boolean NOT NULL DEFAULT true,
  featured boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS products_slug_unique_idx ON products (slug);

CREATE TABLE IF NOT EXISTS settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admin_users (
  id serial PRIMARY KEY,
  username text NOT NULL,
  password_hash text NOT NULL,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS admin_users_username_unique_idx ON admin_users (username);

CREATE TABLE IF NOT EXISTS orders (
  id serial PRIMARY KEY,
  tracking_code text NOT NULL,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_address text NOT NULL,
  customer_province text NOT NULL DEFAULT '',
  customer_city text NOT NULL DEFAULT '',
  postal_code text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_amount bigint NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  shipping_code text NOT NULL DEFAULT '',
  tracking_link text NOT NULL DEFAULT '',
  admin_notes text NOT NULL DEFAULT '',
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS orders_tracking_code_unique_idx ON orders (tracking_code);
