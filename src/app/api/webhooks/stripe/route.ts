import { NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/db";
import { subscriptions, payments, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireStripe } from "@/lib/stripe";
import type { SubscriptionStatus } from "@/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_STATUSES: SubscriptionStatus[] = [
  "active",
  "trialing",
  "past_due",
  "canceled",
  "unpaid",
  "incomplete",
  "incomplete_expired",
  "paused",
];

function mapStatus(s: string | null | undefined): SubscriptionStatus {
  return (ALLOWED_STATUSES as string[]).includes(s ?? "")
    ? (s as SubscriptionStatus)
    : "incomplete";
}

async function userIdFromCustomer(customerId: string | null): Promise<string | null> {
  if (!customerId) return null;
  const rows = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.stripeCustomerId, customerId))
    .limit(1);
  return rows[0]?.id ?? null;
}

async function upsertSubscription(sub: Stripe.Subscription) {
  const userId =
    (sub.metadata?.userId as string | undefined) ||
    (await userIdFromCustomer(typeof sub.customer === "string" ? sub.customer : sub.customer.id));
  if (!userId) return;
  const item = sub.items.data[0];
  const price = item?.price;
  const periodStart = item?.current_period_start
    ? new Date(item.current_period_start * 1000)
    : null;
  const periodEnd = item?.current_period_end
    ? new Date(item.current_period_end * 1000)
    : null;

  const values = {
    userId,
    stripeSubscriptionId: sub.id,
    stripePriceId: price?.id ?? null,
    stripeProductId: typeof price?.product === "string" ? price.product : price?.product?.id ?? null,
    planId: (sub.metadata?.planId as string) || null,
    planName: (sub.metadata?.planName as string) || null,
    status: mapStatus(sub.status),
    currentPeriodStart: periodStart,
    currentPeriodEnd: periodEnd,
    cancelAtPeriodEnd: sub.cancel_at_period_end ?? false,
    updatedAt: new Date(),
  };

  await db
    .insert(subscriptions)
    .values(values)
    .onConflictDoUpdate({
      target: subscriptions.stripeSubscriptionId,
      set: values,
    });
}

async function recordPayment(
  source: Stripe.PaymentIntent | Stripe.Invoice,
  fallbackSession?: Stripe.Checkout.Session,
) {
  const customerId =
    typeof source.customer === "string" ? source.customer : source.customer?.id ?? null;
  const userId = await userIdFromCustomer(customerId);
  if (!userId) return;

  const isInvoice = source.object === "invoice";
  const invoice = isInvoice ? (source as Stripe.Invoice) : null;
  const intent = !isInvoice ? (source as Stripe.PaymentIntent) : null;

  const amount = invoice ? invoice.amount_paid ?? 0 : intent?.amount_received ?? 0;
  const currency = source.currency ?? "ron";
  const status = source.status ?? "unknown";

  await db
    .insert(payments)
    .values({
      userId,
      stripePaymentIntentId: intent?.id ?? null,
      stripeInvoiceId: invoice?.id ?? null,
      stripeCheckoutSessionId: fallbackSession?.id ?? null,
      amount,
      currency,
      status,
      planId: (fallbackSession?.metadata?.planId as string) || null,
      planName: (fallbackSession?.metadata?.planName as string) || null,
      mode: fallbackSession?.mode ?? null,
    })
    .onConflictDoNothing({ target: payments.stripePaymentIntentId });
}

export async function POST(req: Request) {
  const stripe = requireStripe();
  const sig = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !secret) {
    return NextResponse.json({ error: "Missing signature or webhook secret." }, { status: 400 });
  }

  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, secret);
  } catch (err) {
    console.error("Stripe webhook signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === "subscription" && session.subscription) {
          const subId = typeof session.subscription === "string" ? session.subscription : session.subscription.id;
          const sub = await stripe.subscriptions.retrieve(subId);
          await upsertSubscription(sub);
        }
        if (session.mode === "payment" && session.payment_intent) {
          const piId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent.id;
          const pi = await stripe.paymentIntents.retrieve(piId);
          await recordPayment(pi, session);
        }
        break;
      }
      case "invoice.paid":
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        await recordPayment(invoice);
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await upsertSubscription(sub);
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.error("Stripe webhook handler error", err);
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
