CREATE TABLE IF NOT EXISTS "payment_attempts" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL REFERENCES "orders"("id") ON DELETE RESTRICT,
	"provider" text DEFAULT 'zibal' NOT NULL,
	"track_id" text NOT NULL,
	"amount" bigint DEFAULT 0 NOT NULL,
	"amount_rials" bigint DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"payment_link" text DEFAULT '' NOT NULL,
	"verified_ref" text DEFAULT '' NOT NULL,
	"raw_gateway_response" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "payment_attempts_provider_track_id_idx" ON "payment_attempts" ("provider", "track_id");
CREATE UNIQUE INDEX IF NOT EXISTS "payment_attempts_one_pending_per_order_idx"
  ON "payment_attempts" ("order_id") WHERE "status" = 'pending';
