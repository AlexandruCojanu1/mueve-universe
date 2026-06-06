import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { appSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return { err: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { userId: session.user.id! };
}

/** Merge a patch into the launch value so gate/winners survive arm/launch/reset. */
async function patchLaunch(patch: Record<string, unknown>) {
  const [row] = await db
    .select({ value: appSettings.value })
    .from(appSettings)
    .where(eq(appSettings.key, "launch"))
    .limit(1);
  const value = { ...((row?.value as Record<string, unknown>) ?? { state: "live" }), ...patch };
  await db
    .insert(appSettings)
    .values({ key: "launch", value, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: appSettings.key,
      set: { value, updatedAt: new Date() },
    });
  return value;
}

export async function POST(req: Request) {
  const r = await requireAdmin();
  if ("err" in r) return r.err;

  const { action } = (await req.json().catch(() => ({}))) as { action?: string };

  if (action === "arm") {
    // Pre-launch holding screen on the public site.
    const value = await patchLaunch({ state: "pre" });
    return NextResponse.json({ ok: true, ...value });
  }
  if (action === "launch") {
    // Countdown starts in 3s — clients poll every 1.2s while armed, so every
    // open phone catches the start before 10 appears and they count in sync.
    const startAt = new Date(Date.now() + 3000).toISOString();
    const value = await patchLaunch({ state: "countdown", startAt });
    return NextResponse.json({ ok: true, ...value });
  }
  if (action === "reset") {
    const value = await patchLaunch({ state: "live" });
    return NextResponse.json({ ok: true, ...value });
  }
  if (action === "gate-on") {
    const value = await patchLaunch({ gate: true });
    return NextResponse.json({ ok: true, ...value });
  }
  if (action === "gate-off") {
    const value = await patchLaunch({ gate: false });
    return NextResponse.json({ ok: true, ...value });
  }
  if (action === "hide-winners") {
    const value = await patchLaunch({ winners: null });
    return NextResponse.json({ ok: true, ...value });
  }
  return NextResponse.json({ error: "Acțiune necunoscută" }, { status: 400 });
}
