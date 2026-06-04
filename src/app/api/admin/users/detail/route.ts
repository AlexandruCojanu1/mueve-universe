import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import {
  attendances,
  classCredits,
  reservations,
  subscriptions,
  users,
  xpEvents,
} from "@/db/schema";
import { and, desc, eq, gte, inArray, isNull, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return { err: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { userId: session.user.id! };
}

export async function GET(req: Request) {
  const r = await requireAdmin();
  if ("err" in r) return r.err;

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id lipsă" }, { status: 400 });

  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      createdAt: users.createdAt,
      walletAddedAt: users.walletAddedAt,
      stravaAthleteName: users.stravaAthleteName,
      gender: users.gender,
    })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  if (!user) return NextResponse.json({ error: "User inexistent" }, { status: 404 });

  const [xp] = await db
    .select({ total: sql<number>`coalesce(sum(${xpEvents.awardedXp}), 0)::int` })
    .from(xpEvents)
    .where(eq(xpEvents.userId, id));

  const [att] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(attendances)
    .where(eq(attendances.userId, id));

  const [sub] = await db
    .select({
      planName: subscriptions.planName,
      status: subscriptions.status,
      currentPeriodEnd: subscriptions.currentPeriodEnd,
    })
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.userId, id),
        inArray(subscriptions.status, ["active", "trialing", "past_due"]),
      ),
    )
    .orderBy(desc(subscriptions.createdAt))
    .limit(1);

  const [credits] = await db
    .select({
      available: sql<number>`count(*) filter (where ${classCredits.expiresAt} > now())::int`,
    })
    .from(classCredits)
    .where(and(eq(classCredits.userId, id), isNull(classCredits.consumedAt)));

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = await db
    .select({
      slotDate: reservations.slotDate,
      status: reservations.status,
    })
    .from(reservations)
    .where(
      and(
        eq(reservations.userId, id),
        eq(reservations.status, "active"),
        gte(reservations.slotDate, today),
      ),
    )
    .orderBy(reservations.slotDate)
    .limit(10);

  return NextResponse.json({
    user,
    xp: xp.total,
    attendances: att.total,
    activeSub: sub ?? null,
    creditsAvailable: credits?.available ?? 0,
    upcomingReservations: upcoming,
  });
}
