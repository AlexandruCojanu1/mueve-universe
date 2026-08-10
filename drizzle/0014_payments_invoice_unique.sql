-- Stripe fires BOTH invoice.paid and invoice.payment_succeeded for the same
-- invoice, and both were recorded. Invoice-sourced rows carry no payment intent
-- id, so the unique index on stripe_payment_intent_id never caught them (in
-- Postgres two NULLs never conflict) and every subscription payment was stored
-- twice. Keep the first row of each invoice, drop the rest, then make the
-- invoice id unique so it cannot happen again.
DELETE FROM "payments" p
USING "payments" q
WHERE p."stripe_invoice_id" IS NOT NULL
  AND p."stripe_invoice_id" = q."stripe_invoice_id"
  AND (
    p."created_at" > q."created_at"
    OR (p."created_at" = q."created_at" AND p."id" > q."id")
  );

CREATE UNIQUE INDEX IF NOT EXISTS "payments_stripe_invoice_id_unique"
  ON "payments" ("stripe_invoice_id");
