import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { appSettings } from "@/db/schema";

async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return { err: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { userId: session.user.id! };
}

async function setLaunch(value: Record<string, unknown>) {
  await db
    .insert(appSettings)
    .values({ key: "launch", value, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: appSettings.key,
      set: { value, updatedAt: new Date() },
    });
}

export async function POST(req: Request) {
  const r = await requireAdmin();
  if ("err" in r) return r.err;

  const { action } = (await req.json().catch(() => ({}))) as { action?: string };

  if (action === "arm") {
    // Pre-launch holding screen on the public site.
    await setLaunch({ state: "pre" });
    return NextResponse.json({ ok: true, state: "pre" });
  }
  if (action === "launch") {
    // Countdown starts in 3s — clients poll every 1.2s while armed, so every
    // open phone catches the start before 10 appears and they count in sync.
    const startAt = new Date(Date.now() + 3000).toISOString();
    await setLaunch({ state: "countdown", startAt });
    return NextResponse.json({ ok: true, state: "countdown", startAt });
  }
  if (action === "reset") {
    await setLaunch({ state: "live" });
    return NextResponse.json({ ok: true, state: "live" });
  }
  return NextResponse.json({ error: "Acțiune necunoscută" }, { status: 400 });
}
