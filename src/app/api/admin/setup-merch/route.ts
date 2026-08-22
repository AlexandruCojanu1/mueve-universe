import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { sections } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireStripe, stripeEnabled } from "@/lib/stripe";
import { getOrCreateMerchPrice, MERCH_TEE } from "@/lib/merch";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Admin-guarded one-shot helper to wire the pre-sale tricou:
//   GET  → list the pricing tiers/plans so we can see the live structure.
//   POST { planId } → mark that plan as kind:"merch" + provision the Stripe
//           price (idempotent). Safe to leave (admin-only); remove after use.

type PlanLite = {
  id: string;
  name?: { ro?: string; en?: string };
  price?: string;
  kind?: string;
  stripePriceId?: string;
};
type TierLite = { id: string; title?: { ro?: string; en?: string }; plans?: PlanLite[] };

async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return { err: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { ok: true as const };
}

async function loadPricing() {
  const [row] = await db
    .select({ id: sections.id, data: sections.data })
    .from(sections)
    .where(eq(sections.type, "pricing"))
    .limit(1);
  return row ?? null;
}

export async function GET() {
  const r = await requireAdmin();
  if ("err" in r) return r.err;
  const row = await loadPricing();
  if (!row) return NextResponse.json({ error: "No pricing section." }, { status: 404 });
  const tiers = (row.data as { tiers?: TierLite[] })?.tiers ?? [];
  return NextResponse.json({
    sectionId: row.id,
    stripeEnabled,
    merch: MERCH_TEE,
    tiers: tiers.map((t) => ({
      id: t.id,
      title: t.title,
      plans: (t.plans ?? []).map((p) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        kind: p.kind,
        stripePriceId: p.stripePriceId,
      })),
    })),
  });
}

export async function POST(req: Request) {
  const r = await requireAdmin();
  if ("err" in r) return r.err;

  const body = (await req.json().catch(() => ({}))) as { planId?: string };
  const row = await loadPricing();
  if (!row) return NextResponse.json({ error: "No pricing section." }, { status: 404 });

  const data = row.data as { tiers?: TierLite[] };
  const tiers = data.tiers ?? [];
  const allPlans = tiers.flatMap((t) => t.plans ?? []);

  // Target the given plan, else auto-match by name/price (tricou / tee / 79).
  const plan =
    (body.planId && allPlans.find((p) => p.id === body.planId)) ||
    allPlans.find((p) => {
      const n = `${p.name?.ro ?? ""} ${p.name?.en ?? ""}`.toLowerCase();
      return n.includes("tricou") || n.includes("tee") || n.includes("merch") || p.price === "79";
    });
  if (!plan) {
    return NextResponse.json(
      { error: "Nu am găsit planul de merch. Trimite planId (vezi GET)." },
      { status: 400 },
    );
  }

  plan.kind = "merch";

  let priceId: string | null = null;
  if (stripeEnabled) {
    priceId = await getOrCreateMerchPrice(requireStripe());
    plan.stripePriceId = priceId; // informativ; checkout-ul folosește lookup_key
  }

  await db
    .update(sections)
    .set({ data, updatedAt: new Date() })
    .where(eq(sections.id, row.id));

  return NextResponse.json({
    ok: true,
    wiredPlan: { id: plan.id, name: plan.name, kind: plan.kind },
    stripePriceId: priceId,
  });
}
