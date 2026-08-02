import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { appSettings, raffleEntries } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return { err: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { userId: session.user.id! };
}

export async function GET() {
  const r = await requireAdmin();
  if ("err" in r) return r.err;

  const [row] = await db
    .select({ value: appSettings.value })
    .from(appSettings)
    .where(eq(appSettings.key, "raffle"))
    .limit(1);

  const [counts] = await db
    .select({
      girls: sql<number>`count(*) filter (where ${raffleEntries.gender} = 'f')::int`,
      boys: sql<number>`count(*) filter (where ${raffleEntries.gender} = 'm')::int`,
      total: sql<number>`count(*)::int`,
    })
    .from(raffleEntries);

  return NextResponse.json({ raffle: row?.value ?? null, eligible: counts });
}

export async function POST() {
  const r = await requireAdmin();
  if ("err" in r) return r.err;

  // One single winner, picked at random across ALL launch-gate entries —
  // the gender (fată / băiat) falls out of the draw itself.
  const [winner] = await db
    .select({
      name: raffleEntries.name,
      email: raffleEntries.email,
      gender: raffleEntries.gender,
    })
    .from(raffleEntries)
    .orderBy(sql`random()`)
    .limit(1);

  if (!winner) {
    return NextResponse.json(
      { error: "Nicio înscriere la poartă încă (nume + email)." },
      { status: 400 },
    );
  }

  const value = { winner, drawnAt: new Date().toISOString() };
  await db
    .insert(appSettings)
    .values({ key: "raffle", value, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: appSettings.key,
      set: { value, updatedAt: new Date() },
    });

  // Broadcast the winner to every open phone (name only, no email).
  const [launchRow] = await db
    .select({ value: appSettings.value })
    .from(appSettings)
    .where(eq(appSettings.key, "launch"))
    .limit(1);
  const launchValue = {
    ...((launchRow?.value as Record<string, unknown>) ?? { state: "live" }),
    winners: {
      winner: { name: winner.name, gender: winner.gender },
      shownAt: new Date().toISOString(),
    },
  };
  await db
    .insert(appSettings)
    .values({ key: "launch", value: launchValue, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: appSettings.key,
      set: { value: launchValue, updatedAt: new Date() },
    });

  return NextResponse.json({ ok: true, raffle: value });
}
