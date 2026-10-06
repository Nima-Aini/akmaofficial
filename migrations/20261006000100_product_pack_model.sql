-- Additive retail/wholesale pack configuration and mode-specific product media.
-- Nullable wholesale pack fields intentionally preserve legacy quantity semantics
-- until an administrator supplies reliable pack configuration.
ALTER TABLE products ADD COLUMN IF NOT EXISTS retail_unit_label text NOT NULL DEFAULT 'عدد';
ALTER TABLE products ADD COLUMN IF NOT EXISTS wholesale_pack_size integer;
ALTER TABLE products ADD COLUMN IF NOT EXISTS wholesale_pack_label text NOT NULL DEFAULT '';
ALTER TABLE products ADD COLUMN IF NOT EXISTS wholesale_min_pack_qty integer;
ALTER TABLE products ADD COLUMN IF NOT EXISTS retail_images jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE products ADD COLUMN IF NOT EXISTS wholesale_images jsonb NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN products.wholesale_pack_size IS 'Units per wholesale pack; NULL means legacy unit-compatible fallback (1).';
COMMENT ON COLUMN products.wholesale_min_pack_qty IS 'Minimum number of wholesale packs; NULL falls back to legacy wholesale_min_qty.';
