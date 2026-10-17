ALTER TABLE "products"
  ADD COLUMN IF NOT EXISTS "retail_mobile_images" jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS "wholesale_mobile_images" jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS "desktop_object_position" jsonb NOT NULL DEFAULT '{"x":50,"y":50}'::jsonb,
  ADD COLUMN IF NOT EXISTS "mobile_object_position" jsonb NOT NULL DEFAULT '{"x":50,"y":50}'::jsonb,
  ADD COLUMN IF NOT EXISTS "text_formatting" jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE "blog_posts"
  ADD COLUMN IF NOT EXISTS "text_formatting" jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE "cart_product_suggestions"
  ADD COLUMN IF NOT EXISTS "message_rich_text" jsonb NOT NULL DEFAULT '{"segments":[]}'::jsonb;
