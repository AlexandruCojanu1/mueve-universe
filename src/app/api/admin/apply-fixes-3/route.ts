import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { sections } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * One-shot, re-runnable content fixes against the LIVE sections row.
 * Idempotent — safe to call multiple times. Auth: x-one-time-token header
 * (or ?token=) OR an admin session.
 *
 * Always applies (idempotent):
 *  - pricing: drop the PASS badge, unblur PASS benefits ("||"), and split the
 *    non-PASS tier into two tiers — SESIUNI (single drop-in) + ABONAMENTE.
 *  - footer: add the WhatsApp group social link if missing.
 * Optional (?removeSlotId=ID): remove that one program slot (the empty
 * "ÎN CURÂND" placeholder).
 */
const ONE_TIME_TOKEN = "mueve-apply-fixes-3-2026-06-24";
const WHATSAPP_HREF = "https://chat.whatsapp.com/Dnn34LTCz2wBLHfD3giLQm";

type Bi = { ro: string; en: string };
type Plan = {
  id?: string;
  badge?: Bi;
  features?: Bi[];
  classCount?: number;
  checkoutMode?: string;
  period?: Bi;
  [k: string]: unknown;
};
type Tier = { id?: string; featured?: boolean; plans?: Plan[]; [k: string]: unknown };

const bi = (ro: string, en: string): Bi => ({ ro, en });
const isPassTier = (t: Tier) =>
  (typeof t.id === "string" && t.id.toLowerCase().includes("pass")) || t.featured === true;
const stripBlur = (b: Bi): Bi => ({
  ro: (b?.ro ?? "").replace(/\|\|/g, ""),
  en: (b?.en ?? "").replace(/\|\|/g, ""),
});
const isSesiune = (p: Plan): boolean => {
  const cc = typeof p.classCount === "number" ? p.classCount : null;
  if (cc !== null) return cc === 1;
  return p.checkoutMode === "payment";
};

async function getRow(type: string) {
  const rows = await db.select().from(sections).where(eq(sections.type, type)).limit(1);
  return rows[0] ?? null;
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

  const removeSlotId = req.nextUrl.searchParams.get("removeSlotId");
  const report: Record<string, unknown> = {};

  // ── PRICING ──
  const pricingRow = await getRow("pricing");
  if (pricingRow) {
    const data = pricingRow.data as { tiers?: Tier[]; [k: string]: unknown };
    const tiers: Tier[] = Array.isArray(data.tiers) ? data.tiers : [];

    const passTier = tiers.find(isPassTier);
    const otherPlans: Plan[] = tiers
      .filter((t) => !isPassTier(t))
      .flatMap((t) => (Array.isArray(t.plans) ? t.plans : []));

    report.pricingBefore = {
      tiers: tiers.map((t) => ({
        id: t.id,
        plans: (t.plans ?? []).map((p) => ({
          id: p.id,
          badge: p.badge?.ro,
          classCount: p.classCount,
          checkoutMode: p.checkoutMode,
          period: p.period?.ro,
        })),
      })),
    };

    const newTiers: Tier[] = [];
    if (passTier) {
      for (const p of passTier.plans ?? []) {
        delete p.badge;
        if (Array.isArray(p.features)) p.features = p.features.map(stripBlur);
      }
      newTiers.push(passTier);
    }
    const sesiuni = otherPlans.filter(isSesiune);
    const abonamente = otherPlans.filter((p) => !isSesiune(p));
    if (sesiuni.length) {
      newTiers.push({
        id: "tier-sesiuni",
        title: bi("SESIUNI", "SESSIONS"),
        subtitle: bi("Plătești o singură clasă, fără abonament", "Pay per class, no subscription"),
        plans: sesiuni,
      });
    }
    if (abonamente.length) {
      newTiers.push({
        id: "tier-abonamente",
        title: bi("ABONAMENTE", "MEMBERSHIPS"),
        subtitle: bi("Pachete lunare de clase", "Monthly class packs"),
        plans: abonamente,
      });
    }

    data.tiers = newTiers;
    await db
      .update(sections)
      .set({ data: data as Record<string, unknown>, updatedAt: new Date() })
      .where(eq(sections.id, pricingRow.id));
    report.pricingAfter = {
      tiers: newTiers.map((t) => ({ id: t.id, planIds: (t.plans ?? []).map((p) => p.id) })),
    };
  }

  // ── FOOTER ──
  const footerRow = await getRow("footer");
  if (footerRow) {
    const data = footerRow.data as {
      socials?: Array<{ id: string; label: string; href: string; icon: string }>;
      [k: string]: unknown;
    };
    const socials = Array.isArray(data.socials) ? data.socials : [];
    report.footerBefore = socials.map((s) => ({ icon: s.icon, href: s.href }));
    const hasWa = socials.some(
      (s) => s.icon === "whatsapp" || (s.href || "").includes("chat.whatsapp.com"),
    );
    if (!hasWa) {
      socials.push({ id: "wa", label: "WhatsApp", href: WHATSAPP_HREF, icon: "whatsapp" });
    } else {
      // normalize to the correct group link
      for (const s of socials) {
        if (s.icon === "whatsapp" || (s.href || "").includes("chat.whatsapp.com")) {
          s.href = WHATSAPP_HREF;
          s.icon = "whatsapp";
        }
      }
    }
    data.socials = socials;
    await db
      .update(sections)
      .set({ data: data as Record<string, unknown>, updatedAt: new Date() })
      .where(eq(sections.id, footerRow.id));
    report.footerAfter = socials.map((s) => ({ icon: s.icon, href: s.href }));
  }

  // ── PROGRAM ──
  const programRow = await getRow("program");
  if (programRow) {
    const data = programRow.data as {
      slots?: Array<Record<string, unknown>>;
      [k: string]: unknown;
    };
    const slots = Array.isArray(data.slots) ? data.slots : [];
    report.programSlots = slots.map((s) => ({
      id: s.id,
      day: s.day,
      row: s.row,
      activity: (s.activity as Bi | undefined)?.ro,
      teaser: s.teaser,
    }));
    if (removeSlotId) {
      const next = slots.filter((s) => s.id !== removeSlotId);
      report.removed = slots.length - next.length;
      data.slots = next;
      await db
        .update(sections)
        .set({ data: data as Record<string, unknown>, updatedAt: new Date() })
        .where(eq(sections.id, programRow.id));
    }
  }

  return NextResponse.json({ ok: true, report });
}
