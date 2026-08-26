import { NextResponse } from "next/server";
import { requireStripe, stripeEnabled } from "@/lib/stripe";
import { rateLimitAsync, clientKey } from "@/lib/rate-limit";
import { getOrCreateMerchPrice, merchNameField, merchSizeField, MERCH_TEE } from "@/lib/merch";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Guest checkout for the pre-sale tricou. Unlike /api/checkout (classes/Pass),
 * this needs NO login and NO active Pass — merch is a plain physical good.
 * Tees are handed over in person (community pre-sale, no courier), so no
 * shipping address: Stripe's hosted page collects email, full name, phone and
 * size, all mandatory; fulfilment data lives on the Stripe session.
 */
export async function POST(req: Request) {
  const rl = await rateLimitAsync(clientKey(req, "checkout-merch"), 10, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Prea multe încercări. Reîncearcă în puțin timp." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfter / 1000)) } },
    );
  }

  if (!stripeEnabled) {
    return NextResponse.json(
      { error: "Plățile nu sunt configurate momentan." },
      { status: 503 },
    );
  }

  const stripe = requireStripe();
  const priceId = await getOrCreateMerchPrice(stripe);
  const origin = req.headers.get("origin") ?? new URL(req.url).origin;

  const baseParams = {
    mode: "payment",
    line_items: [
      {
        price: priceId,
        quantity: 1,
        adjustable_quantity: { enabled: true, minimum: 1, maximum: 10 },
      },
    ],
    customer_creation: "always",
    phone_number_collection: { enabled: true },
    custom_fields: [merchNameField(), merchSizeField()],
    allow_promotion_codes: true,
    billing_address_collection: "auto",
    success_url: `${origin}/?merch=success`,
    cancel_url: `${origin}/#pricing`,
    metadata: { kind: "merch", planName: MERCH_TEE.productName },
  } satisfies Parameters<typeof stripe.checkout.sessions.create>[0];

  // Ask for Terms acceptance when the ToS URL is set in the Dashboard; fall
  // back to a plain session so payments never break if it isn't.
  let checkout;
  try {
    checkout = await stripe.checkout.sessions.create({
      ...baseParams,
      consent_collection: { terms_of_service: "required" },
      custom_text: {
        terms_of_service_acceptance: {
          message: `Sunt de acord cu [Termenii și condițiile](${origin}/terms) MUEVE UNIVERSE.`,
        },
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (!msg.includes("terms of service")) throw err;
    checkout = await stripe.checkout.sessions.create(baseParams);
  }

  return NextResponse.json({ url: checkout.url });
}
