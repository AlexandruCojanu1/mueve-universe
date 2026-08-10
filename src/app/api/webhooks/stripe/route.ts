import { NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/db";
import { subscriptions, payments, users, processedWebhookEvents } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireStripe } from "@/lib/stripe";
import type { SubscriptionStatus } from "@/db/schema";
import { grantCredits } from "@/lib/credits";
import { issueOblioInvoice, oblioEnabled } from "@/lib/oblio";
import { sendEmail, emailEnabled } from "@/lib/mailer";
import { captureError } from "@/lib/observability";

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

const ADMIN_NOTIFY = process.env.ADMIN_NOTIFY_EMAIL || "mueve.universe@gmail.com";

/** Best-effort sale notification to the admin inbox. Never throws. */
async function notifyAdminSale(args: {
  clientName: string | null;
  clientEmail: string;
  planName: string;
  amountBani: number;
  currency: string;
  kind: "abonament" | "pachet" | "reînnoire";
}) {
  if (!emailEnabled()) return;
  const suma = `${(args.amountBani / 100).toFixed(2)} ${args.currency.toUpperCase()}`;
  const cine = args.clientName ? `${args.clientName} (${args.clientEmail})` : args.clientEmail;
  try {
    await sendEmail({
      to: ADMIN_NOTIFY,
      subject: `Vânzare nouă · ${args.planName} · ${suma}`,
      text: [
        `Vânzare nouă pe mueve.ro`,
        ``,
        `Tip: ${args.kind}`,
        `Plan: ${args.planName}`,
        `Sumă: ${suma}`,
        `Client: ${cine}`,
        ``,
        `Detalii: https://www.mueve.ro/admin/billing`,
      ].join("\n"),
    });
  } catch (err) {
    captureError(err, { scope: "admin-sale-notify" });
  }
}

async function userFromCustomer(
  customerId: string | null,
): Promise<{ id: string; name: string | null; email: string } | null> {
  if (!customerId) return null;
  const rows = await db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(eq(users.stripeCustomerId, customerId))
    .limit(1);
  return rows[0] ?? null;
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

  // Stripe fires BOTH invoice.paid and invoice.payment_succeeded for the same
  // invoice, and both land here. Invoice-sourced rows have no payment intent id,
  // so the ON CONFLICT below (keyed on that column) never fired for them —
  // Postgres treats two NULLs as distinct — and every subscription payment was
  // recorded twice. Key invoices on their own id instead.
  if (invoice?.id) {
    const seen = await db
      .select({ id: payments.id })
      .from(payments)
      .where(eq(payments.stripeInvoiceId, invoice.id))
      .limit(1);
    if (seen.length > 0) return;
  }

  try {
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
  } catch (err) {
    // 23505 = unique violation on stripe_invoice_id: the twin event won the
    // race between the check above and this insert. Already recorded, done.
    if ((err as { code?: string })?.code === "23505") return;
    throw err;
  }
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
    captureError(err, { scope: "stripe-webhook-signature" });
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const marker = await db
    .insert(processedWebhookEvents)
    .values({ eventId: event.id, source: "stripe" })
    .onConflictDoNothing({ target: processedWebhookEvents.eventId })
    .returning({ eventId: processedWebhookEvents.eventId });
  if (marker.length === 0) {
    return NextResponse.json({ received: true, duplicate: true });
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

          // Merch (tricou / physical good): NOT a class pack — grant no credits
          // and require no Pass. Fulfilment data (shipping address, phone, size)
          // lives on the Stripe session. Still issue an Oblio fiscal invoice and
          // email it to the buyer (best-effort, keyed to the guest's details).
          if (session.metadata?.kind === "merch") {
            console.log("[webhook] merch order paid", {
              session: session.id,
              paymentIntent: pi.id,
              amount: pi.amount_received,
            });
            const buyerEmail = session.customer_details?.email;
            const buyerName = session.customer_details?.name || buyerEmail || "Client";
            if (oblioEnabled() && buyerEmail) {
              try {
                await issueOblioInvoice({
                  stripeRef: pi.id,
                  clientName: buyerName,
                  clientEmail: buyerEmail,
                  productName: (session.metadata?.planName as string) || "MUEVE CLUB TEE",
                  amountBani: pi.amount_received ?? 0,
                  currency: pi.currency ?? "ron",
                  seriesName: process.env.OBLIO_SERIES_PACKAGE || undefined,
                });
              } catch (err) {
                captureError(err, { scope: "merch-oblio", session: session.id });
              }
            }
            break;
          }

          await recordPayment(pi, session);
          const userId = await userIdFromCustomer(
            typeof session.customer === "string"
              ? session.customer
              : session.customer?.id ?? null,
          );
          if (userId) {
            const rawCount = Number(session.metadata?.classCount ?? "1");
            const count = Number.isFinite(rawCount) && rawCount > 0 ? Math.floor(rawCount) : 1;
            await grantCredits({
              userId,
              count,
              stripePaymentIntentId: pi.id,
              stripeCheckoutSessionId: session.id,
              planId: (session.metadata?.planId as string) || null,
              planName: (session.metadata?.planName as string) || null,
            });
          }
          if (oblioEnabled()) {
            const client = await userFromCustomer(
              typeof session.customer === "string"
                ? session.customer
                : session.customer?.id ?? null,
            );
            if (client) {
              await issueOblioInvoice({
                stripeRef: pi.id,
                clientName: client.name || client.email,
                clientEmail: client.email,
                productName:
                  (session.metadata?.planName as string) || "Pachet clase MUEVE",
                amountBani: pi.amount_received ?? 0,
                currency: pi.currency ?? "ron",
                seriesName: process.env.OBLIO_SERIES_PACKAGE || undefined,
              });
            }
          }
          {
            const client = await userFromCustomer(
              typeof session.customer === "string"
                ? session.customer
                : session.customer?.id ?? null,
            );
            if (client) {
              await notifyAdminSale({
                clientName: client.name,
                clientEmail: client.email,
                planName: (session.metadata?.planName as string) || "Pachet clase",
                amountBani: pi.amount_received ?? 0,
                currency: pi.currency ?? "ron",
                kind: "pachet",
              });
            }
          }
        }
        break;
      }
      case "invoice.paid":
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        await recordPayment(invoice);
        if ((invoice.amount_paid ?? 0) > 0) {
          const client = await userFromCustomer(
            typeof invoice.customer === "string"
              ? invoice.customer
              : invoice.customer?.id ?? null,
          );
          if (client && oblioEnabled()) {
            await issueOblioInvoice({
              stripeRef: invoice.id ?? `inv-${event.id}`,
              clientName: client.name || client.email,
              clientEmail: client.email,
              productName:
                invoice.lines?.data?.[0]?.description || "Abonament MUEVE UNIVERSE PASS",
              amountBani: invoice.amount_paid ?? 0,
              currency: invoice.currency ?? "ron",
              seriesName: process.env.OBLIO_SERIES_SUBSCRIPTION || undefined,
            });
          }
          // Only on invoice.paid — invoice.payment_succeeded fires for the same
          // invoice and would double the email.
          if (client && event.type === "invoice.paid") {
            await notifyAdminSale({
              clientName: client.name,
              clientEmail: client.email,
              planName: "MUEVE UNIVERSE PASS",
              amountBani: invoice.amount_paid ?? 0,
              currency: invoice.currency ?? "ron",
              kind: invoice.billing_reason === "subscription_create" ? "abonament" : "reînnoire",
            });
          }
        }
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
    captureError(err, { scope: "stripe-webhook-handler", eventType: event.type, eventId: event.id });
    await db
      .delete(processedWebhookEvents)
      .where(eq(processedWebhookEvents.eventId, event.id));
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
