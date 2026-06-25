import { NextResponse } from "next/server";
import { syncClassSlotsFromProgram } from "@/lib/sync-class-slots";

export const dynamic = "force-dynamic";

// One-shot operational endpoint: reconcile bookable class_slots with the public
// programme on prod (whose DB is only reachable from inside the deploy).
// Guarded by a one-time token; remove this route after running.
const ONE_TIME_TOKEN = "492e9b00c43447a19efb64bd07cb4006fe2e";

async function handle(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (token !== ONE_TIME_TOKEN) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const dryRun = url.searchParams.get("dry") === "1";
  try {
    const report = await syncClassSlotsFromProgram({ dryRun });
    return NextResponse.json({ ok: true, report });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: (e as Error).message },
      { status: 500 },
    );
  }
}

export async function GET(req: Request) {
  return handle(req);
}
export async function POST(req: Request) {
  return handle(req);
}
