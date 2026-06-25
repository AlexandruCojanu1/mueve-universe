import { NextResponse } from "next/server";
import { db } from "@/db";
import { sections } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

// One-shot operational endpoint: tidy the "Pilates (în curând)" programme label
// on prod (whose DB is only reachable from inside the deploy). Collapses the
// stray spaces and normalises the casing. Guarded by a one-time token; remove
// this route after running.
const ONE_TIME_TOKEN = "f0858f7fac2d311a4bc9fbd27e752cb8c0e9";

const RO_CLEAN = "Pilates (în curând)";
const EN_CLEAN = "Pilates (coming soon)";

type Slot = {
  id?: string;
  activity?: { ro?: string; en?: string };
  [k: string]: unknown;
};

async function handle(req: Request) {
  const url = new URL(req.url);
  if (url.searchParams.get("token") !== ONE_TIME_TOKEN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const dryRun = url.searchParams.get("dry") === "1";

  const [row] = await db
    .select({ id: sections.id, data: sections.data })
    .from(sections)
    .where(eq(sections.type, "program"))
    .limit(1);
  if (!row) {
    return NextResponse.json({ ok: false, error: "no program section" }, { status: 404 });
  }

  const data = row.data as { slots?: Slot[] } & Record<string, unknown>;
  const slots = data.slots ?? [];
  const changes: { before: { ro?: string; en?: string }; after: { ro: string; en: string } }[] = [];

  for (const s of slots) {
    const ro = s.activity?.ro ?? "";
    const en = s.activity?.en ?? "";
    if (/pilates/i.test(ro) || /pilates/i.test(en)) {
      changes.push({ before: { ro, en }, after: { ro: RO_CLEAN, en: EN_CLEAN } });
      s.activity = { ...(s.activity ?? {}), ro: RO_CLEAN, en: EN_CLEAN };
    }
  }

  if (!dryRun && changes.length > 0) {
    await db
      .update(sections)
      .set({ data: { ...data, slots }, updatedAt: new Date() })
      .where(eq(sections.id, row.id));
  }

  return NextResponse.json({ ok: true, dryRun, changes });
}

export async function GET(req: Request) {
  return handle(req);
}
export async function POST(req: Request) {
  return handle(req);
}
