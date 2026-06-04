import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { sections, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireStripe, stripeEnabled } from "@/lib/stripe";
import { rateLimitAsync, clientKey } from "@/lib/rate-limit";
import { hasActivePass } from "@/lib/credits";

export async function POST(req: Request) {
  const rl = await rateLimitAsync(clientKey(req, "checkout"), 10, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Prea multe încercări. Reîncearcă în puțin timp." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfter / 1000)) } },
    );
  }

  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ redirect: "/login?from=/" }, { status: 401 });
  }

  if (!stripeEnabled) {
    return NextResponse.json(
      { error: "Stripe is not configured. Set STRIPE_SECRET_KEY in .env.local." },
      { status: 503 },
    );
  }

  const body = (await req.json().catch(() => ({}))) as {
    priceId?: string;
  };

  const priceId = body.priceId;
  if (!priceId) {
    return NextResponse.json({ error: "Missing priceId." }, { status: 400 });
  }

  // Resolve the plan SERVER-SIDE from the pricing section, keyed by price ID.
  // The client never dictates mode / credit count / plan metadata.
  const [pricingRow] = await db
    .select({ data: sections.data })
    .from(sections)
    .where(eq(sections.type, "pricing"))
    .limit(1);
  type PlanLite = {
    id: string;
    name?: { ro?: string };
    stripePriceId?: string;
    checkoutMode?: "subscription" | "payment";
    classCount?: number;
  };
  const tiers = (pricingRow?.data as { tiers?: { plans?: PlanLite[] }[] })?.tiers ?? [];
  const plan = tiers
    .flatMap((t) => t.plans ?? [])
    .find((pl) => pl.stripePriceId === priceId);
  if (!plan) {
    return NextResponse.json({ error: "Plan necunoscut." }, { status: 400 });
  }

  const mode = plan.checkoutMode === "payment" ? "payment" : "subscription";

  if (mode === "payment") {
    const ok = await hasActivePass(session.user.id);
    if (!ok) {
      return NextResponse.json(
        {
          error:
            "Ai nevoie de Pass activ ca să cumperi clase. Cumpără întâi Pass-ul lunar.",
          needsPass: true,
        },
        { status: 403 },
      );
    }
  } else {
    const alreadyActive = await hasActivePass(session.user.id);
    if (alreadyActive) {
      return NextResponse.json(
        {
          error:
            "Ai deja un abonament activ. Gestionează-l din dashboard (anulează sau schimbă planul) înainte să iei altul.",
          alreadySubscribed: true,
        },
        { status: 409 },
      );
    }
  }

  const classCount =
    mode === "payment" && Number.isFinite(plan.classCount) && (plan.classCount ?? 0) > 0
      ? Math.floor(plan.classCount!)
      : 1;

  const stripe = requireStripe();

  const userRows = await db
    .select()
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);
  const user = userRows[0];
  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name ?? undefined,
      metadata: { userId: user.id },
    });
    customerId = customer.id;
    await db
      .update(users)
      .set({ stripeCustomerId: customerId })
      .where(eq(users.id, user.id));
  }

  const origin = req.headers.get("origin") ?? new URL(req.url).origin;

  const baseParams = {
    mode,
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/dashboard?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/#pricing`,
    metadata: {
      userId: user.id,
      planId: plan.id,
      planName: plan.name?.ro ?? plan.id,
      classCount: mode === "payment" ? String(classCount) : "",
    },
    subscription_data:
      mode === "subscription"
        ? { metadata: { userId: user.id, planId: plan.id, planName: plan.name?.ro ?? plan.id } }
        : undefined,
    allow_promotion_codes: true,
    billing_address_collection: "auto",
  } satisfies Parameters<typeof stripe.checkout.sessions.create>[0];

  // Require accepting the Terms before paying. Stripe shows the checkbox only
  // if the ToS URL is configured in the Dashboard (Settings → Public details);
  // until then we fall back to a plain session so payments never break.
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
    console.error("Stripe ToS consent unavailable (set the URL in Dashboard → Public details):", msg);
    checkout = await stripe.checkout.sessions.create(baseParams);
  }

  return NextResponse.json({ url: checkout.url });
}
