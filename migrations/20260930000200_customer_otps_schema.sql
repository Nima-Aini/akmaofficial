-- Migration for production persistent DB-backed OTP storage and rate limiting
CREATE TABLE IF NOT EXISTS customer_otps (
  phone text PRIMARY KEY,
  otp_hash text NOT NULL,
  expires_at timestamp NOT NULL,
  attempt_count integer NOT NULL DEFAULT 0,
  last_requested_at timestamp NOT NULL DEFAULT now(),
  hourly_request_count integer NOT NULL DEFAULT 1,
  hour_window_start timestamp NOT NULL DEFAULT now(),
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS customer_otps_expires_at_idx ON customer_otps (expires_at);
