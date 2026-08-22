import type Stripe from "stripe";

/**
 * MUEVE CLUB TEE — pre-sale tricou. Physical good sold through a dedicated
 * guest checkout (no account / no Pass needed): collects a shipping address,
 * phone and size on Stripe's hosted page. The Stripe price is provisioned on
 * demand and keyed by a stable lookup_key so we never create duplicates.
 */
export const MERCH_TEE = {
  lookupKey: "mueve_club_tee_presale",
  productName: "MUEVE CLUB TEE (Pre-Sale)",
  amountBani: 7900, // 79.00 RON, TVA inclus
  currency: "ron",
  sizes: ["S", "M", "L", "XL", "XXL"],
} as const;

/**
 * Get-or-create the live Stripe price for the pre-sale tee. Idempotent: reuses
 * the price carrying our lookup_key, otherwise creates a product + price once.
 */
export async function getOrCreateMerchPrice(stripe: Stripe): Promise<string> {
  const existing = await stripe.prices.list({
    lookup_keys: [MERCH_TEE.lookupKey],
    active: true,
    limit: 1,
  });
  const current = existing.data[0];
  // A Stripe price is immutable, so when the amount here changes we mint a new
  // one and move the lookup_key onto it (the old price stays, archived).
  if (current && current.unit_amount === MERCH_TEE.amountBani) return current.id;

  const price = await stripe.prices.create({
    currency: MERCH_TEE.currency,
    unit_amount: MERCH_TEE.amountBani,
    lookup_key: MERCH_TEE.lookupKey,
    transfer_lookup_key: current ? true : undefined,
    ...(current ? { product: current.product as string } : { product_data: { name: MERCH_TEE.productName } }),
    metadata: { merch: "mueve_club_tee" },
  });
  return price.id;
}

/** Size dropdown shown on the Stripe Checkout page. */
export function merchSizeField() {
  return {
    key: "marime",
    label: { type: "custom" as const, custom: "Mărime tricou" },
    type: "dropdown" as const,
    dropdown: {
      options: MERCH_TEE.sizes.map((s) => ({ label: s, value: s.toLowerCase() })),
    },
  };
}
