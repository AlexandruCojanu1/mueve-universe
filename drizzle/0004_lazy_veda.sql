CREATE TABLE "processed_webhook_events" (
	"event_id" text PRIMARY KEY NOT NULL,
	"source" text DEFAULT 'stripe' NOT NULL,
	"processed_at" timestamp DEFAULT now() NOT NULL
);
