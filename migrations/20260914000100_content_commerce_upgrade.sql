CREATE TABLE IF NOT EXISTS cart_product_suggestions (
  id serial PRIMARY KEY,
  trigger_product_id integer REFERENCES products(id) ON DELETE SET NULL,
  suggested_product_id integer REFERENCES products(id) ON DELETE SET NULL,
  message text NOT NULL DEFAULT '',
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS cart_product_suggestions_pair_unique_idx
  ON cart_product_suggestions (trigger_product_id, suggested_product_id);

CREATE INDEX IF NOT EXISTS cart_product_suggestions_trigger_idx
  ON cart_product_suggestions (trigger_product_id, active, sort_order);

CREATE TABLE IF NOT EXISTS blog_posts (
  id serial PRIMARY KEY,
  title text NOT NULL,
  slug text NOT NULL,
  excerpt text NOT NULL DEFAULT '',
  cover_image text NOT NULL DEFAULT '',
  cover_image_alt text NOT NULL DEFAULT '',
  content jsonb NOT NULL DEFAULT '[]'::jsonb,
  seo_title text NOT NULL DEFAULT '',
  meta_description text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  author text NOT NULL DEFAULT '',
  featured boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  published_at timestamp,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS blog_posts_slug_unique_idx ON blog_posts (slug);
CREATE INDEX IF NOT EXISTS blog_posts_publication_idx
  ON blog_posts (status, published_at DESC, sort_order);
