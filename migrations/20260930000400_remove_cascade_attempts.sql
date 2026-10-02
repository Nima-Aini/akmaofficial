-- Idempotent financial-retention hardening for installations that may have
-- received the earlier CASCADE version of the payment_attempts foreign key.
DO $$
DECLARE
  constraint_name text;
BEGIN
  FOR constraint_name IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'payment_attempts'::regclass
      AND contype = 'f'
      AND pg_get_constraintdef(oid) ILIKE '%FOREIGN KEY (order_id)%'
  LOOP
    EXECUTE format('ALTER TABLE payment_attempts DROP CONSTRAINT %I', constraint_name);
  END LOOP;

  ALTER TABLE payment_attempts
    ADD CONSTRAINT payment_attempts_order_id_orders_id_fk
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE RESTRICT;
END $$;
