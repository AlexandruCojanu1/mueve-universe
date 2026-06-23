import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { auth } from "@/auth";
import { db } from "@/db";
import { sections } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

// One-shot maintenance endpoint. Idempotent — safe to hit twice. Applies the
// pricing trim + Strava DB cleanup directly on the live database, since the
// live (Coolify) DB is only reachable from inside the deployment.
// Auth: admin session OR a one-time ?key whose sha256 matches the constant
// below (the key itself is never committed). Remove this route after running.
const KEY_HASH = "d7b6bc2ff18800f6e42dacf8655fab2ca9df5de67e471dbc390e81ae1642a80e";

async function authorize(req: Request): Promise<{ err: NextResponse } | { ok: true }> {
  const key = new URL(req.url).searchParams.get("key");
  if (key && createHash("sha256").update(key).digest("hex") === KEY_HASH) {
    return { ok: true };
  }
  const session = await auth();
  if (session?.user?.role === "admin") return { ok: true };
  return { err: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
}

const KEEP = new Set(["plan-class", "plan-orbit"]);
const NEW_PRICE: Record<string, string> = {
  "plan-class": "39.90",
  "plan-orbit": "129.90",
};

export async function GET(req: Request) {
  const r = await authorize(req);
  if ("err" in r) return r.err;

  const result: Record<string, unknown> = {};

  // ── 1. Pricing: drop GALAXY + UNIVERSE, reprice MUEVE CLASS + ORBIT ──
  const [row] = await db.select().from(sections).where(eq(sections.type, "pricing")).limit(1);
  if (!row) {
    result.pricing = "no pricing section found";
  } else {
    const data = row.data as { tiers?: { id: string; plans: { id: string; price: string }[] }[] };
    const removed: string[] = [];
    const repriced: string[] = [];
    for (const tier of data.tiers ?? []) {
      if (tier.id !== "tier-classes") continue;
      tier.plans = tier.plans.filter((p) => {
        if (KEEP.has(p.id)) return true;
        removed.push(p.id);
        return false;
      });
      for (const p of tier.plans) {
        if (NEW_PRICE[p.id] && p.price !== NEW_PRICE[p.id]) {
          repriced.push(`${p.id}:${p.price}->${NEW_PRICE[p.id]}`);
          p.price = NEW_PRICE[p.id];
        }
      }
    }
    await db
      .update(sections)
      .set({ data: data as Record<string, unknown>, updatedAt: new Date() })
      .where(eq(sections.id, row.id));
    result.pricing = { removed, repriced };
  }

  // ── 2. Strava: drop leftover columns + table (idempotent) ──
  await db.execute(sql`
    ALTER TABLE users
      DROP COLUMN IF EXISTS strava_athlete_id,
      DROP COLUMN IF EXISTS strava_athlete_name,
      DROP COLUMN IF EXISTS strava_access_token,
      DROP COLUMN IF EXISTS strava_refresh_token,
      DROP COLUMN IF EXISTS strava_token_expires_at,
      DROP COLUMN IF EXISTS strava_last_sync_at,
      DROP COLUMN IF EXISTS strava_xp
  `);
  await db.execute(sql`DROP TABLE IF EXISTS strava_activities`);
  result.strava = "columns + table dropped (if existed)";

  revalidatePath("/");
  revalidatePath("/admin");

  return NextResponse.json({ ok: true, ...result });
}
