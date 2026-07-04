import { NextResponse } from "next/server";
import { db } from "@/db";
import { sections } from "@/db/schema";
import { eq } from "drizzle-orm";

// Temp utility to repoint the PASS plan's Stripe price + display (for a cheap
// end-to-end test). Guarded by CRON_SECRET (an env secret, not in the repo).
// Remove after use.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const secret = url.searchParams.get("secret");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const priceId = url.searchParams.get("priceId");
  const display = url.searchParams.get("display");
  if (!priceId || !display) {
    return NextResponse.json({ error: "priceId and display required" }, { status: 400 });
  }

  const [row] = await db
    .select({ id: sections.id, data: sections.data })
    .from(sections)
    .where(eq(sections.type, "pricing"))
    .limit(1);
  if (!row) return NextResponse.json({ error: "no pricing row" }, { status: 404 });

  const data = row.data as {
    tiers?: { plans?: { id: string; stripePriceId?: string; price?: string }[] }[];
  };
  let old: { stripePriceId?: string; price?: string } | null = null;
  for (const tier of data.tiers ?? []) {
    for (const plan of tier.plans ?? []) {
      if (plan.id === "plan-pass") {
        old = { stripePriceId: plan.stripePriceId, price: plan.price };
        plan.stripePriceId = priceId;
        plan.price = display;
      }
    }
  }
  if (!old) return NextResponse.json({ error: "plan-pass not found" }, { status: 404 });

  await db
    .update(sections)
    .set({ data, updatedAt: new Date() })
    .where(eq(sections.id, row.id));

  return NextResponse.json({ ok: true, old, new: { stripePriceId: priceId, price: display } });
}
