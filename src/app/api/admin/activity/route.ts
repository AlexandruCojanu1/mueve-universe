import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { attendances, classSlots, users, xpEvents } from "@/db/schema";
import { desc, eq, gte, sql } from "drizzle-orm";

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

  const now = new Date();
  const d7 = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
  const d28 = new Date(now.getTime() - 28 * 24 * 3600 * 1000);

  const [counts] = await db
    .select({
      total: sql<number>`count(*)::int`,
      last7: sql<number>`count(*) filter (where ${attendances.validatedAt} >= ${d7.toISOString()}::timestamp)::int`,
      last28: sql<number>`count(*) filter (where ${attendances.validatedAt} >= ${d28.toISOString()}::timestamp)::int`,
    })
    .from(attendances);

  const [members] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(users)
    .where(eq(users.role, "user"));

  const recent = await db
    .select({
      userEmail: users.email,
      userName: users.name,
      slotDate: attendances.slotDate,
      method: attendances.method,
      validatedAt: attendances.validatedAt,
      classType: classSlots.classType,
      startTime: classSlots.startTime,
    })
    .from(attendances)
    .innerJoin(users, eq(users.id, attendances.userId))
    .leftJoin(classSlots, sql`${classSlots.id}::text = ${attendances.slotId}`)
    .orderBy(desc(attendances.validatedAt))
    .limit(50);

  // XP leaderboard straight from the ledger (same aggregate as the dashboard).
  const runsByUser = db
    .select({
      userId: attendances.userId,
      runs: sql<number>`count(*)::int`.as("runs"),
    })
    .from(attendances)
    .groupBy(attendances.userId)
    .as("runs_by_user");

  const leaderboard = await db
    .select({
      email: users.email,
      name: users.name,
      xp: sql<number>`coalesce(sum(${xpEvents.awardedXp}), 0)::int`,
      runs: sql<number>`coalesce(${runsByUser.runs}, 0)::int`,
    })
    .from(xpEvents)
    .innerJoin(users, eq(users.id, xpEvents.userId))
    .leftJoin(runsByUser, eq(runsByUser.userId, xpEvents.userId))
    .groupBy(xpEvents.userId, users.email, users.name, runsByUser.runs)
    .orderBy(desc(sql`coalesce(sum(${xpEvents.awardedXp}), 0)`))
    .limit(10);

  // XP awarded in the last 7 days (all sources).
  const [xp7] = await db
    .select({ total: sql<number>`coalesce(sum(${xpEvents.awardedXp}), 0)::int` })
    .from(xpEvents)
    .where(gte(xpEvents.createdAt, d7));

  return NextResponse.json({
    stats: {
      members: members.total,
      attendancesTotal: counts.total,
      attendances7: counts.last7,
      attendances28: counts.last28,
      xp7: xp7.total,
    },
    recent,
    leaderboard,
  });
}
