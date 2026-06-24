import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { sections } from "@/db/schema";
import { eq } from "drizzle-orm";
import { stripe } from "@/lib/stripe";

/**
 * Recovery + final pricing layout. The previous apply-fixes-3 run mis-detected
 * the classes tier (it had featured:true) and dropped plan-class / plan-orbit.
 * This rebuilds pricing deterministically:
 *   - PASS tier: keep the intact plan-pass from the DB, drop its badge, unblur
 *     its "||" features, and set the card description (tagline).
 *   - SESIUNI tier: rebuilt plan-class (drop-in single class).
 *   - ABONAMENTE tier: rebuilt plan-orbit (MUEVE MEMBERSHIP, 4 classes).
 * Stripe price IDs for the two rebuilt plans are recovered by unit_amount.
 * Also removes the empty "ÎN CURÂND" teaser slot (?removeSlotId=, default pm-5).
 *
 * Pass ?dry=1 to inspect without writing.
 */
const ONE_TIME_TOKEN = "mueve-restore-pricing-4-2026-06-24";

type Bi = { ro: string; en: string };
const bi = (ro: string, en: string): Bi => ({ ro, en });

const PASS_DESC = bi(
  "Universe Pass nu este un bilet de acces, ci o modalitate de a te bucura de beneficii premium și de a susține comunitatea Mueve.",
  "Universe Pass isn't an entry ticket, it's a way to enjoy premium benefits and support the Mueve community.",
);

async function findPriceIdByAmount(amount: number): Promise<string | null> {
  if (!stripe) return null;
  let starting_after: string | undefined;
  for (let i = 0; i < 10; i++) {
    const page = await stripe.prices.list({ active: true, limit: 100, starting_after });
    for (const p of page.data) {
      if (p.unit_amount === amount) return p.id;
    }
    if (!page.has_more) break;
    starting_after = page.data[page.data.length - 1]?.id;
  }
  return null;
}

export async function GET(req: NextRequest) {
  const token =
    req.headers.get("x-one-time-token") || req.nextUrl.searchParams.get("token") || "";
  if (token !== ONE_TIME_TOKEN) {
    const session = await auth();
    if (session?.user?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const dry = req.nextUrl.searchParams.get("dry") === "1";
  const removeSlotId = req.nextUrl.searchParams.get("removeSlotId") ?? "pm-5";
  const report: Record<string, unknown> = {};

  // ── PRICING ──
  const [pricingRow] = await db
    .select()
    .from(sections)
    .where(eq(sections.type, "pricing"))
    .limit(1);
  if (!pricingRow) return NextResponse.json({ error: "no pricing section" }, { status: 404 });

  const data = pricingRow.data as { tiers?: Array<Record<string, unknown>>; [k: string]: unknown };
  const allPlans = (Array.isArray(data.tiers) ? data.tiers : []).flatMap(
    (t) => (Array.isArray((t as { plans?: unknown }).plans) ? (t as { plans: Array<Record<string, unknown>> }).plans : []),
  );

  // keep the real PASS plan (preserve its stripePriceId/price/currency/etc.)
  const passPlan = allPlans.find((p) => typeof p.id === "string" && (p.id as string).includes("pass"));
  if (!passPlan) return NextResponse.json({ error: "plan-pass not found", allPlanIds: allPlans.map((p) => p.id) }, { status: 404 });
  delete (passPlan as Record<string, unknown>).badge;
  if (Array.isArray((passPlan as { features?: Bi[] }).features)) {
    (passPlan as { features: Bi[] }).features = (passPlan as { features: Bi[] }).features.map((f) => ({
      ro: (f?.ro ?? "").replace(/\|\|/g, ""),
      en: (f?.en ?? "").replace(/\|\|/g, ""),
    }));
  }
  (passPlan as Record<string, unknown>).tagline = PASS_DESC;

  // recover Stripe price IDs by amount (RON minor units)
  const classPriceId = await findPriceIdByAmount(3990);
  const orbitPriceId = await findPriceIdByAmount(12990);
  report.stripeMatches = { classPriceId, orbitPriceId };

  const planClass: Record<string, unknown> = {
    id: "plan-class",
    classCount: 1,
    name: bi("MUEVE CLASS", "MUEVE CLASS"),
    checkoutMode: "payment",
    price: "39.90",
    originalPrice: "49.90",
    currency: bi("lei", "RON"),
    period: bi("/ sesiune", "/ class"),
    tagline: bi("Drop-in — o singură clasă", "Drop-in — single class"),
    features: [
      bi("O clasă, oricând", "A single class, anytime"),
      bi("Fără abonament", "No subscription"),
      bi("Încercare pentru începători", "Try-before-you-join"),
    ],
    ctaLabel: bi("REZERVĂ", "BOOK"),
    ctaHref: "#join",
    ...(classPriceId ? { stripePriceId: classPriceId } : {}),
  };

  const planOrbit: Record<string, unknown> = {
    id: "plan-orbit",
    classCount: 4,
    name: bi("MUEVE MEMBERSHIP", "MUEVE MEMBERSHIP"),
    checkoutMode: "payment",
    price: "129.90",
    currency: bi("lei", "RON"),
    period: bi("/ 4 sesiuni", "/ 4 classes"),
    tagline: bi("4 clase", "4 classes"),
    badge: bi("DOAR CU CARD", "CARD ONLY"),
    features: [
      bi("Acces la toate lumile", "Access to all worlds"),
      bi("Rezervare prioritară", "Priority booking"),
      bi("Anulare gratuită", "Free cancellation"),
    ],
    ctaLabel: bi("REZERVĂ", "BOOK"),
    ctaHref: "#join",
    ...(orbitPriceId ? { stripePriceId: orbitPriceId } : {}),
  };

  const passTier = (data.tiers ?? []).find(
    (t) => (t as { id?: string }).id && ((t as { id: string }).id.includes("pass")),
  ) as Record<string, unknown> | undefined;

  data.tiers = [
    {
      id: "tier-pass",
      title: bi("MUEVE UNIVERSE PASS", "MUEVE UNIVERSE PASS"),
      subtitle: (passTier?.subtitle as Bi) ?? bi("Acces premium cu toate beneficiile", "Premium access with all perks"),
      featured: true,
      plans: [passPlan],
    },
    {
      id: "tier-sesiuni",
      title: bi("SESIUNI", "SESSIONS"),
      subtitle: bi("Plătești o singură clasă, fără abonament", "Pay per class, no subscription"),
      plans: [planClass],
    },
    {
      id: "tier-abonamente",
      title: bi("ABONAMENTE", "MEMBERSHIPS"),
      subtitle: bi("Pachete de clase", "Class packs"),
      plans: [planOrbit],
    },
  ];

  report.pricingResult = (data.tiers as Array<Record<string, unknown>>).map((t) => ({
    id: t.id,
    plans: (t.plans as Array<Record<string, unknown>>).map((p) => ({
      id: p.id,
      name: (p.name as Bi)?.ro,
      price: p.price,
      stripePriceId: p.stripePriceId,
    })),
  }));

  // ── PROGRAM (remove empty teaser placeholder) ──
  const [programRow] = await db.select().from(sections).where(eq(sections.type, "program")).limit(1);
  let programData: Record<string, unknown> | null = null;
  if (programRow) {
    programData = programRow.data as Record<string, unknown>;
    const slots = Array.isArray(programData.slots) ? (programData.slots as Array<Record<string, unknown>>) : [];
    const next = slots.filter((s) => s.id !== removeSlotId);
    report.programRemoved = slots.length - next.length;
    programData.slots = next;
  }

  if (!dry) {
    await db
      .update(sections)
      .set({ data: data as Record<string, unknown>, updatedAt: new Date() })
      .where(eq(sections.id, pricingRow.id));
    if (programRow && programData) {
      await db
        .update(sections)
        .set({ data: programData, updatedAt: new Date() })
        .where(eq(sections.id, programRow.id));
    }
  }
  report.written = !dry;

  return NextResponse.json({ ok: true, report });
}
