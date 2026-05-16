CREATE TABLE "strava_activities" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text DEFAULT '' NOT NULL,
	"sport_type" text DEFAULT '' NOT NULL,
	"distance_meters" integer DEFAULT 0 NOT NULL,
	"moving_time_sec" integer DEFAULT 0 NOT NULL,
	"started_at" timestamp NOT NULL,
	"xp_awarded" integer DEFAULT 0 NOT NULL,
	"imported_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "strava_athlete_id" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "strava_athlete_name" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "strava_access_token" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "strava_refresh_token" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "strava_token_expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "strava_last_sync_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "strava_xp" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "strava_activities" ADD CONSTRAINT "strava_activities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "strava_activities_user_idx" ON "strava_activities" USING btree ("user_id","started_at");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_strava_athlete_id_unique" UNIQUE("strava_athlete_id");