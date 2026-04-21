CREATE TYPE "public"."reservation_status" AS ENUM('active', 'cancelled', 'attended');--> statement-breakpoint
CREATE TABLE "reservations" (
	"user_id" uuid NOT NULL,
	"slot_id" uuid NOT NULL,
	"slot_date" text NOT NULL,
	"status" "reservation_status" DEFAULT 'active' NOT NULL,
	"credit_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"cancelled_at" timestamp,
	CONSTRAINT "reservations_user_id_slot_id_slot_date_pk" PRIMARY KEY("user_id","slot_id","slot_date")
);
--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;