CREATE TYPE "public"."credit_source" AS ENUM('purchase', 'pass_included');--> statement-breakpoint
CREATE TABLE "class_credits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"source_type" "credit_source" DEFAULT 'purchase' NOT NULL,
	"stripe_payment_intent_id" text,
	"stripe_checkout_session_id" text,
	"plan_id" text,
	"plan_name" text,
	"purchased_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	"consumed_at" timestamp,
	"consumed_slot_id" text,
	"consumed_slot_date" text
);
--> statement-breakpoint
ALTER TABLE "class_credits" ADD CONSTRAINT "class_credits_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;