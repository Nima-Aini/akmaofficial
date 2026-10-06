-- Additive product-card text-region positioning. CMS banner positions remain
-- inside the existing settings JSON so current content and identifiers persist.
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS card_text_region_position text NOT NULL DEFAULT 'bottom';

COMMENT ON COLUMN products.card_text_region_position IS
  'Visual location of the frosted product-card content region: right, left, bottom, or center.';
