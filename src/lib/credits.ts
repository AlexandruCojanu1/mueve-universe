import { db } from "@/db";
import { classCredits, subscriptions } from "@/db/schema";
import type { SubscriptionStatus } from "@/db/schema";
import { and, asc, eq, gt, inArray, isNull } from "drizzle-orm";

export const ACTIVE_PASS_STATUSES = [
  "active",
  "trialing",
  "past_due",
] as const satisfies readonly SubscriptionStatus[];

export function endOfMonth(from = new Date()): Date {
  return new Date(
    from.getFullYear(),
    from.getMonth() + 1,
    0,
    23,
    59,
    59,
    999,
  );
}

export async function hasActivePass(userId: string): Promise<boolean> {
  const rows = await db
    .select({ id: subscriptions.id })
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.userId, userId),
        inArray(subscriptions.status, [...ACTIVE_PASS_STATUSES]),
      ),
    )
    .limit(1);
  return rows.length > 0;
}

export async function getActivePassRow(userId: string) {
  const rows = await db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.userId, userId),
        inArray(subscriptions.status, [...ACTIVE_PASS_STATUSES]),
      ),
    )
    .limit(1);
  return rows[0] ?? null;
}

export async function grantCredits(params: {
  userId: string;
  count: number;
  stripePaymentIntentId?: string | null;
  stripeCheckoutSessionId?: string | null;
  planId?: string | null;
  planName?: string | null;
  expiresAt?: Date;
}): Promise<void> {
  const count = Math.max(1, Math.floor(params.count));
  const expiresAt = params.expiresAt ?? endOfMonth();
  const rows = Array.from({ length: count }, () => ({
    userId: params.userId,
    sourceType: "purchase" as const,
    stripePaymentIntentId: params.stripePaymentIntentId ?? null,
    stripeCheckoutSessionId: params.stripeCheckoutSessionId ?? null,
    planId: params.planId ?? null,
    planName: params.planName ?? null,
    expiresAt,
  }));
  await db.insert(classCredits).values(rows);
}

export async function getCreditBalance(userId: string): Promise<{
  total: number;
  nextExpiry: Date | null;
}> {
  const now = new Date();
  const rows = await db
    .select({
      id: classCredits.id,
      expiresAt: classCredits.expiresAt,
    })
    .from(classCredits)
    .where(
      and(
        eq(classCredits.userId, userId),
        isNull(classCredits.consumedAt),
        gt(classCredits.expiresAt, now),
      ),
    )
    .orderBy(asc(classCredits.expiresAt));

  return {
    total: rows.length,
    nextExpiry: rows[0]?.expiresAt ?? null,
  };
}

export async function consumeOldestCredit(params: {
  userId: string;
  slotId: string;
  slotDate: string;
}): Promise<{ consumed: boolean; creditId?: string }> {
  const now = new Date();
  const rows = await db
    .select({ id: classCredits.id })
    .from(classCredits)
    .where(
      and(
        eq(classCredits.userId, params.userId),
        isNull(classCredits.consumedAt),
        gt(classCredits.expiresAt, now),
      ),
    )
    .orderBy(asc(classCredits.expiresAt))
    .limit(1);

  const credit = rows[0];
  if (!credit) return { consumed: false };

  const updated = await db
    .update(classCredits)
    .set({
      consumedAt: now,
      consumedSlotId: params.slotId,
      consumedSlotDate: params.slotDate,
    })
    .where(
      and(
        eq(classCredits.id, credit.id),
        isNull(classCredits.consumedAt),
      ),
    )
    .returning({ id: classCredits.id });

  if (updated.length === 0) return { consumed: false };
  return { consumed: true, creditId: credit.id };
}
