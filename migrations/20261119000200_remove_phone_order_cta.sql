-- Remove the legacy CMS button while retaining every other hero field.
UPDATE "settings"
SET "value" = jsonb_set("value", '{secondaryCta}',
  '{"label":"خرید عمده و همکاری","href":"/products?mode=wholesale"}'::jsonb),
  "updated_at" = now()
WHERE "key" = 'hero' AND (
  "value" #>> '{secondaryCta,label}' LIKE '%سفارش تلفنی%'
  OR lower("value" #>> '{secondaryCta,href}') LIKE 'tel:%'
);
