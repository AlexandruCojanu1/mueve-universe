import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
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
    planId?: string;
    planName?: string;
    mode?: "subscription" | "payment";
    classCount?: number;
  };

  const priceId = body.priceId;
  if (!priceId) {
    return NextResponse.json({ error: "Missing priceId." }, { status: 400 });
  }

  const mode = body.mode === "payment" ? "payment" : "subscription";

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
  }

  const classCount =
    mode === "payment" && Number.isFinite(body.classCount) && (body.classCount ?? 0) > 0
      ? Math.floor(body.classCount!)
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

  const checkout = await stripe.checkout.sessions.create({
    mode,
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/dashboard?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/#pricing`,
    metadata: {
      userId: user.id,
      planId: body.planId ?? "",
      planName: body.planName ?? "",
      classCount: mode === "payment" ? String(classCount) : "",
    },
    subscription_data:
      mode === "subscription"
        ? { metadata: { userId: user.id, planId: body.planId ?? "", planName: body.planName ?? "" } }
        : undefined,
    allow_promotion_codes: true,
    billing_address_collection: "auto",
  });

  return NextResponse.json({ url: checkout.url });
}
