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
  amountBani: 8900, // 89.00 RON, TVA inclus
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
  if (existing.data[0]) return existing.data[0].id;

  const price = await stripe.prices.create({
    currency: MERCH_TEE.currency,
    unit_amount: MERCH_TEE.amountBani,
    lookup_key: MERCH_TEE.lookupKey,
    product_data: { name: MERCH_TEE.productName },
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
