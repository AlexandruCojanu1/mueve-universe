import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { classCredits, payments, subscriptions, users } from "@/db/schema";
import { desc, eq, inArray, sql } from "drizzle-orm";

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

  const subs = await db
    .select({
      userEmail: users.email,
      userName: users.name,
      planName: subscriptions.planName,
      status: subscriptions.status,
      currentPeriodEnd: subscriptions.currentPeriodEnd,
      cancelAtPeriodEnd: subscriptions.cancelAtPeriodEnd,
    })
    .from(subscriptions)
    .innerJoin(users, eq(users.id, subscriptions.userId))
    .where(inArray(subscriptions.status, ["active", "trialing", "past_due"]))
    .orderBy(desc(subscriptions.createdAt))
    .limit(100);

  const recentPayments = await db
    .select({
      userEmail: users.email,
      userName: users.name,
      amount: payments.amount,
      currency: payments.currency,
      status: payments.status,
      planName: payments.planName,
      mode: payments.mode,
      createdAt: payments.createdAt,
    })
    .from(payments)
    .innerJoin(users, eq(users.id, payments.userId))
    .orderBy(desc(payments.createdAt))
    .limit(50);

  const credits = await db
    .select({
      userEmail: users.email,
      userName: users.name,
      available: sql<number>`count(*) filter (where ${classCredits.consumedAt} is null and ${classCredits.expiresAt} > now())::int`,
      consumed: sql<number>`count(*) filter (where ${classCredits.consumedAt} is not null)::int`,
      expired: sql<number>`count(*) filter (where ${classCredits.consumedAt} is null and ${classCredits.expiresAt} <= now())::int`,
    })
    .from(classCredits)
    .innerJoin(users, eq(users.id, classCredits.userId))
    .groupBy(users.email, users.name)
    .orderBy(desc(sql`count(*) filter (where ${classCredits.consumedAt} is null and ${classCredits.expiresAt} > now())`))
    .limit(100);

  const [totals] = await db
    .select({
      revenue: sql<number>`coalesce(sum(${payments.amount}) filter (where ${payments.status} in ('succeeded','paid')), 0)::int`,
      count: sql<number>`count(*)::int`,
    })
    .from(payments);

  return NextResponse.json({
    totals: { revenue: totals.revenue, payments: totals.count, activeSubs: subs.length },
    subs,
    payments: recentPayments,
    credits,
  });
}
