CREATE TABLE IF NOT EXISTS "blocked_devices" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "device_id" text NOT NULL,
  "ip_address" text,
  "user_agent" text,
  "blocked_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "blocked_devices_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "blocked_devices_user_idx"
  ON "blocked_devices" ("user_id");

CREATE UNIQUE INDEX IF NOT EXISTS "blocked_devices_user_device_uniq"
  ON "blocked_devices" ("user_id", "device_id");
