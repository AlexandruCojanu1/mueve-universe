import { NextResponse } from "next/server";
import { lt, sql } from "drizzle-orm";
import { db } from "@/db";
import { partnerVisits } from "@/db/schema";

export const dynamic = "force-dynamic";

const RETENTION_DAYS = 365;

function authorized(req: Request): boolean {
  // Vercel Cron sets x-vercel-cron header; manual triggers must include CRON_SECRET.
  if (req.headers.get("x-vercel-cron")) return true;
  const auth = req.headers.get("authorization") ?? "";
  const expected = process.env.CRON_SECRET;
  return Boolean(expected) && auth === `Bearer ${expected}`;
}

export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);

  const deleted = await db
    .delete(partnerVisits)
    .where(lt(partnerVisits.createdAt, cutoff))
    .returning({ id: partnerVisits.id });

  return NextResponse.json({
    ok: true,
    deletedCount: deleted.length,
    cutoff: cutoff.toISOString(),
    retentionDays: RETENTION_DAYS,
  });
}

// Health-check helper for manual debugging.
export async function POST(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(partnerVisits)
    .where(lt(partnerVisits.createdAt, cutoff));
  return NextResponse.json({ wouldDelete: count, cutoff: cutoff.toISOString() });
}
