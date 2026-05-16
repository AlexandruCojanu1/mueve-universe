import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { syncRecentActivities } from "@/lib/strava";
import { rateLimitAsync, clientKey } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const rl = await rateLimitAsync(clientKey(req, "strava-sync"), 6, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Prea multe sync-uri. Așteaptă un minut." },
      { status: 429 },
    );
  }
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const result = await syncRecentActivities(session.user.id);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Sync failed" },
      { status: 500 },
    );
  }
}
