import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { auth } from "@/auth";
import { db } from "@/db";
import { oblioInvoices } from "@/db/schema";
import { inArray } from "drizzle-orm";
import { requireStripe, stripeEnabled } from "@/lib/stripe";
import { merchBuyerName } from "@/lib/merch";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return { err: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { userId: session.user.id! };
}

/**
 * Merch orders live entirely on Stripe (guest checkout: name, phone and size
 * are collected on the hosted page and never touch our DB), so the admin list
 * is built by walking completed Checkout Sessions and keeping the ones tagged
 * metadata.kind === "merch". Pre-sale volume is tiny; the walk is capped as a
 * safety net. The order status is stored on the PaymentIntent's metadata
 * (mueve_order_status) so no DB migration is needed and it survives redeploys.
 */
const MAX_SESSIONS = 1000;

const ORDER_STATUSES = ["new", "working", "delivered", "cancelled"] as const;
type OrderStatus = (typeof ORDER_STATUSES)[number];

export async function GET() {
  const r = await requireAdmin();
  if ("err" in r) return r.err;
  if (!stripeEnabled) {
    return NextResponse.json({ error: "Stripe nu este configurat." }, { status: 503 });
  }
  const stripe = requireStripe();

  type Order = {
    sessionId: string;
    paymentIntentId: string | null;
    createdAt: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    size: string | null;
    quantity: number;
    amount: number;
    amountRefunded: number;
    currency: string;
    address: string | null;
    status: OrderStatus;
    refunded: boolean;
    invoice: { series: string | null; number: string | null; link: string | null } | null;
  };

  const orders: Order[] = [];
  let scanned = 0;
  for await (const session of stripe.checkout.sessions.list({
    status: "complete",
    limit: 100,
    expand: ["data.payment_intent.latest_charge", "data.line_items"],
  })) {
    if (++scanned > MAX_SESSIONS) break;
    if (session.metadata?.kind !== "merch") continue;
    if (session.payment_status !== "paid") continue;

    const pi =
      session.payment_intent && typeof session.payment_intent !== "string"
        ? (session.payment_intent as Stripe.PaymentIntent)
        : null;
    const charge =
      pi?.latest_charge && typeof pi.latest_charge !== "string"
        ? (pi.latest_charge as Stripe.Charge)
        : null;
    const addr = session.collected_information?.shipping_details?.address ?? null;
    const sizeRaw = session.custom_fields.find((f) => f.key === "marime")?.dropdown?.value ?? null;
    const quantity =
      session.line_items?.data.reduce((sum, li) => sum + (li.quantity ?? 1), 0) ?? 1;

    const rawStatus = pi?.metadata?.mueve_order_status;
    const status: OrderStatus = (ORDER_STATUSES as readonly string[]).includes(rawStatus ?? "")
      ? (rawStatus as OrderStatus)
      : pi?.metadata?.mueve_fulfilled === "1" // legacy shipped toggle
        ? "delivered"
        : "new";

    orders.push({
      sessionId: session.id,
      paymentIntentId:
        pi?.id ?? (typeof session.payment_intent === "string" ? session.payment_intent : null),
      createdAt: new Date(session.created * 1000).toISOString(),
      name: merchBuyerName(session),
      email: session.customer_details?.email ?? null,
      phone: session.customer_details?.phone ?? null,
      size: sizeRaw ? sizeRaw.toUpperCase() : null,
      quantity,
      amount: session.amount_total ?? 0,
      amountRefunded: charge?.amount_refunded ?? 0,
      currency: session.currency ?? "ron",
      // Old orders (before the in-person handover flow) collected an address.
      address: addr
        ? [addr.line1, addr.line2, addr.postal_code, addr.city, addr.state]
            .filter(Boolean)
            .join(", ")
        : null,
      status,
      refunded: !!charge?.refunded,
      invoice: null,
    });
  }

  const refs = orders.map((o) => o.paymentIntentId).filter((x): x is string => !!x);
  if (refs.length > 0) {
    const invoices = await db
      .select({
        stripeRef: oblioInvoices.stripeRef,
        series: oblioInvoices.series,
        number: oblioInvoices.number,
        link: oblioInvoices.link,
      })
      .from(oblioInvoices)
      .where(inArray(oblioInvoices.stripeRef, refs));
    const byRef = new Map(invoices.map((i) => [i.stripeRef, i]));
    for (const o of orders) {
      const inv = o.paymentIntentId ? byRef.get(o.paymentIntentId) : undefined;
      if (inv) o.invoice = { series: inv.series, number: inv.number, link: inv.link };
    }
  }

  return NextResponse.json({ orders });
}

/** Set the order status; stored on the PaymentIntent so no DB migration is needed. */
export async function POST(req: Request) {
  const r = await requireAdmin();
  if ("err" in r) return r.err;
  if (!stripeEnabled) {
    return NextResponse.json({ error: "Stripe nu este configurat." }, { status: 503 });
  }
  const body = (await req.json().catch(() => null)) as
    | { paymentIntentId?: unknown; status?: unknown }
    | null;
  const piId = body?.paymentIntentId;
  const status = body?.status;
  if (typeof piId !== "string" || !piId.startsWith("pi_")) {
    return NextResponse.json({ error: "paymentIntentId invalid." }, { status: 400 });
  }
  if (typeof status !== "string" || !(ORDER_STATUSES as readonly string[]).includes(status)) {
    return NextResponse.json({ error: "status invalid." }, { status: 400 });
  }
  const stripe = requireStripe();
  // An empty string deletes the key on Stripe's side (mueve_fulfilled = the
  // legacy shipped toggle, superseded by mueve_order_status).
  await stripe.paymentIntents.update(piId, {
    metadata: { mueve_order_status: status, mueve_fulfilled: "" },
  });
  return NextResponse.json({ ok: true });
}
