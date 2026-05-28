CREATE TYPE "public"."xp_source" AS ENUM('attendance', 'strava', 'challenge', 'milestone', 'adjustment');--> statement-breakpoint
CREATE TABLE "xp_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"source" "xp_source" NOT NULL,
	"ref_id" text,
	"base_xp" integer DEFAULT 0 NOT NULL,
	"multiplier_bp" integer DEFAULT 100 NOT NULL,
	"awarded_xp" integer NOT NULL,
	"idempotency_key" text NOT NULL,
	"occurred_at" timestamp NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "xp_events_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
ALTER TABLE "xp_events" ADD CONSTRAINT "xp_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "xp_events_user_idx" ON "xp_events" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "xp_events_user_source_idx" ON "xp_events" USING btree ("user_id","source");