CREATE INDEX "admin_actions_actor_created_idx" ON "admin_actions" USING btree ("actor_user_id","created_at");--> statement-breakpoint
CREATE INDEX "admin_actions_target_idx" ON "admin_actions" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE INDEX "class_credits_user_consumed_expires_idx" ON "class_credits" USING btree ("user_id","consumed_at","expires_at");--> statement-breakpoint
CREATE INDEX "partner_visits_partner_created_idx" ON "partner_visits" USING btree ("partner_id","created_at");--> statement-breakpoint
CREATE INDEX "partner_visits_created_idx" ON "partner_visits" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "payments_user_created_idx" ON "payments" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "reservations_slot_date_status_idx" ON "reservations" USING btree ("slot_id","slot_date","status");--> statement-breakpoint
CREATE INDEX "reservations_user_status_date_idx" ON "reservations" USING btree ("user_id","status","slot_date");--> statement-breakpoint
CREATE INDEX "subscriptions_user_status_idx" ON "subscriptions" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "users_stripe_customer_id_idx" ON "users" USING btree ("stripe_customer_id");