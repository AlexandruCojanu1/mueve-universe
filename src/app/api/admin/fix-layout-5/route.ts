import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { sections } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * One-shot, idempotent layout fixes:
 *  - pricing: merge the SESIUNI + ABONAMENTE tiers back into ONE tier so the
 *    two class cards render side by side on a single row (PASS stays separate).
 *  - hero: clear the "Universe Pass nu este…" sub line (keep subBold).
 * Auth: x-one-time-token header / ?token=, or admin session. ?dry=1 to preview.
 */
const ONE_TIME_TOKEN = "mueve-fix-layout-5-2026-06-24";

type Bi = { ro: string; en: string };
const bi = (ro: string, en: string): Bi => ({ ro, en });
const isPassTier = (t: { id?: string }) =>
  typeof t.id === "string" && t.id.toLowerCase().includes("pass");

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
  const report: Record<string, unknown> = {};

  // ── PRICING: merge non-PASS tiers into one ──
  const [pricingRow] = await db.select().from(sections).where(eq(sections.type, "pricing")).limit(1);
  if (pricingRow) {
    const data = pricingRow.data as { tiers?: Array<Record<string, unknown>>; [k: string]: unknown };
    const tiers = Array.isArray(data.tiers) ? data.tiers : [];
    const passTier = tiers.find((t) => isPassTier(t as { id?: string }));
    const classPlans = tiers
      .filter((t) => !isPassTier(t as { id?: string }))
      .flatMap((t) => (Array.isArray((t as { plans?: unknown }).plans) ? (t as { plans: unknown[] }).plans : []));

    const newTiers: Array<Record<string, unknown>> = [];
    if (passTier) newTiers.push(passTier);
    if (classPlans.length) {
      newTiers.push({
        id: "tier-classes",
        title: bi("SESIUNI & ABONAMENTE", "SESSIONS & MEMBERSHIPS"),
        subtitle: bi("De la o clasă la pachete lunare", "From a single class to monthly packs"),
        plans: classPlans,
      });
    }
    data.tiers = newTiers;
    report.pricing = newTiers.map((t) => ({
      id: t.id,
      title: (t.title as Bi)?.ro,
      planIds: (t.plans as Array<{ id?: string }>).map((p) => p.id),
    }));
    if (!dry) {
      await db
        .update(sections)
        .set({ data: data as Record<string, unknown>, updatedAt: new Date() })
        .where(eq(sections.id, pricingRow.id));
    }
  }

  // ── HERO: clear the sub line ──
  const [heroRow] = await db.select().from(sections).where(eq(sections.type, "hero")).limit(1);
  if (heroRow) {
    const data = heroRow.data as Record<string, unknown>;
    report.heroSubBefore = (data.sub as Bi)?.ro;
    data.sub = bi("", "");
    if (!dry) {
      await db
        .update(sections)
        .set({ data, updatedAt: new Date() })
        .where(eq(sections.id, heroRow.id));
    }
  }

  report.written = !dry;
  return NextResponse.json({ ok: true, report });
}
