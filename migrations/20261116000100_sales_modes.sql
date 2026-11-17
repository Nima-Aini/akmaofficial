ALTER TABLE products ADD COLUMN IF NOT EXISTS featured_retail boolean NOT NULL DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS featured_wholesale boolean NOT NULL DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS retail_featured_order integer NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS wholesale_featured_order integer NOT NULL DEFAULT 0;

-- Preserve the previous retail presentation and never feature wholesale implicitly.
UPDATE products SET featured_retail = true, retail_featured_order = sort_order
WHERE featured = true AND featured_retail = false;

-- Correct labels only for stable keys that exist in the current CMS configuration.
-- Unknown keys and their original labels remain untouched for administrator review.
UPDATE products AS product SET category_label = definition.label
FROM (
  SELECT entry->>'key' AS key, entry->>'label' AS label
  FROM settings, jsonb_array_elements(
    CASE WHEN settings.key = 'categories' AND jsonb_typeof(settings.value) = 'array'
      THEN settings.value ELSE '[]'::jsonb END
  ) AS entry
  WHERE settings.key = 'categories'
) AS definition
WHERE product.category = definition.key AND definition.label <> ''
  AND product.category_label IS DISTINCT FROM definition.label;

CREATE TABLE IF NOT EXISTS cart_product_suggestions_by_mode (
  id serial PRIMARY KEY,
  trigger_product_id integer REFERENCES products(id) ON DELETE SET NULL,
  suggested_product_id integer REFERENCES products(id) ON DELETE SET NULL,
  mode text NOT NULL DEFAULT 'retail' CHECK (mode IN ('retail', 'wholesale')),
  message text NOT NULL DEFAULT '',
  message_rich_text jsonb NOT NULL DEFAULT '{"segments":[]}'::jsonb,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS cart_product_suggestions_mode_pair_unique_idx
  ON cart_product_suggestions_by_mode (trigger_product_id, suggested_product_id, mode);

INSERT INTO cart_product_suggestions_by_mode
 (id, trigger_product_id, suggested_product_id, mode, message, message_rich_text, active, sort_order, created_at, updated_at)
SELECT id, trigger_product_id, suggested_product_id, 'retail', message,
       COALESCE(message_rich_text, '{"segments":[]}'::jsonb), active, sort_order, created_at, updated_at
FROM cart_product_suggestions ON CONFLICT (id) DO NOTHING;
SELECT setval(pg_get_serial_sequence('cart_product_suggestions_by_mode', 'id'),
  GREATEST(1, (SELECT COALESCE(MAX(id), 0) FROM cart_product_suggestions_by_mode)),
  (SELECT COUNT(*) > 0 FROM cart_product_suggestions_by_mode));
