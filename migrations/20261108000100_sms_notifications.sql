CREATE TABLE IF NOT EXISTS "sms_notifications" (
  "id" serial PRIMARY KEY,
  "idempotency_key" text NOT NULL UNIQUE,
  "kind" text NOT NULL,
  "order_id" integer REFERENCES "orders"("id") ON DELETE RESTRICT,
  "payment_attempt_id" integer REFERENCES "payment_attempts"("id") ON DELETE RESTRICT,
  "recipient" text NOT NULL,
  "body_id" integer NOT NULL,
  "parameters" jsonb NOT NULL,
  "status" text NOT NULL DEFAULT 'pending',
  "retry_count" integer NOT NULL DEFAULT 0,
  "provider_message_id" text,
  "last_error" text,
  "next_attempt_at" timestamp NOT NULL DEFAULT now(),
  "last_attempt_at" timestamp,
  "sent_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "sms_notifications_due_idx" ON "sms_notifications" ("next_attempt_at", "id") WHERE "status" IN ('pending', 'retry_pending');
