import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { sections } from "@/db/schema";

// TEMPORARY one-shot endpoint to read/replace the pricing CMS section in prod
// (prod DB is only reachable from inside the deploy). Guarded by CRON_SECRET.
// Remove after the price/Galaxy-Universe cleanup is applied.
export const dynamic = "force-dynamic";

function authorized(req: Request): boolean {
  const auth = req.headers.get("authorization") ?? "";
  const expected = process.env.CRON_SECRET;
  return Boolean(expected) && auth === `Bearer ${expected}`;
}

export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const [row] = await db
    .select({ id: sections.id, data: sections.data })
    .from(sections)
    .where(eq(sections.type, "pricing"))
    .limit(1);
  if (!row) return NextResponse.json({ error: "No pricing section" }, { status: 404 });
  return NextResponse.json({ id: row.id, data: row.data });
}

export async function POST(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = (await req.json().catch(() => ({}))) as { data?: Record<string, unknown> };
  if (!body.data || typeof body.data !== "object") {
    return NextResponse.json({ error: "Missing data" }, { status: 400 });
  }
  const updated = await db
    .update(sections)
    .set({ data: body.data, updatedAt: new Date() })
    .where(eq(sections.type, "pricing"))
    .returning({ id: sections.id });
  return NextResponse.json({ ok: true, updated: updated.length });
}
