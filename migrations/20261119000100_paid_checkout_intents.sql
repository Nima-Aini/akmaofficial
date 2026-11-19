-- Historical orders and their attempts are retained unchanged.
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "retail_old_price" bigint;

CREATE TABLE IF NOT EXISTS "checkout_intents" (
  "id" text PRIMARY KEY,
  "customer_id" integer NOT NULL REFERENCES "customer_users"("id") ON DELETE RESTRICT,
  "order_data" jsonb NOT NULL,
  "total_amount" bigint NOT NULL CHECK ("total_amount" > 0),
  "status" text NOT NULL DEFAULT 'pending',
  "order_id" integer UNIQUE REFERENCES "orders"("id") ON DELETE RESTRICT,
  "expires_at" timestamp NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

ALTER TABLE "payment_attempts" ALTER COLUMN "order_id" DROP NOT NULL;
ALTER TABLE "payment_attempts" ADD COLUMN IF NOT EXISTS "checkout_intent_id" text REFERENCES "checkout_intents"("id") ON DELETE RESTRICT;
CREATE INDEX IF NOT EXISTS "payment_attempts_intent_idx" ON "payment_attempts" ("checkout_intent_id");
CREATE UNIQUE INDEX IF NOT EXISTS "payment_attempts_intent_paid_ref_idx"
  ON "payment_attempts" ("provider", "verified_ref")
  WHERE "checkout_intent_id" IS NOT NULL AND "status" = 'paid' AND "verified_ref" <> '';

-- The old default site description was copied into settings on first install.
-- Remove the obsolete telephone-order claim without changing other CMS text.
UPDATE "settings"
SET "value" = jsonb_set("value", '{seoDescription}',
    to_jsonb(replace("value"->>'seoDescription', 'سفارش تلفنی: ۰۹۰۳۳۲۵۳۰۶۵', 'پرداخت امن آنلاین'))),
    "updated_at" = now()
WHERE "key" = 'site' AND "value"->>'seoDescription' LIKE '%سفارش تلفنی: ۰۹۰۳۳۲۵۳۰۶۵%';
