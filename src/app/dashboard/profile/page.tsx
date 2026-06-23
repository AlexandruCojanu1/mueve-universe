import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/db";
import { users, subscriptions, payments, attendances } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import ProfileView, {
  type ProfileViewData,
} from "@/components/dashboard/ProfileView";
import { cleanDisplayName } from "@/lib/display-name";
import { appleWalletEnabled } from "@/lib/wallet/apple";
import { googleWalletEnabled } from "@/lib/wallet/google";
import { getCreditBalance } from "@/lib/credits";
import { getUserStats } from "@/lib/leaderboard";

export const dynamic = "force-dynamic";

function initials(name: string | null | undefined, email: string | null | undefined): string {
  const src = (name || email || "").trim();
  if (!src) return "M";
  const parts = src.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return src.slice(0, 2).toUpperCase();
}

export default async function ProfilePage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login?from=/dashboard/profile");

  const safe = async <T,>(fn: () => Promise<T>, fallback: T): Promise<T> => {
    try {
      return await fn();
    } catch {
      return fallback;
    }
  };

  const userRow = (await safe(
    () => db.select().from(users).where(eq(users.id, userId)).limit(1),
    [],
  ))[0];
  const recentPayments = await safe(
    () =>
      db
        .select()
        .from(payments)
        .where(eq(payments.userId, userId))
        .orderBy(desc(payments.createdAt))
        .limit(5),
    [],
  );
  const activeSub = (await safe(
    () =>
      db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, userId))
        .orderBy(desc(subscriptions.updatedAt))
        .limit(1),
    [],
  ))[0];
  const credits = await safe(
    () => getCreditBalance(userId),
    { total: 0, nextExpiry: null } as Awaited<ReturnType<typeof getCreditBalance>>,
  );
  const attendanceHistory = await safe(
    () =>
      db
        .select()
        .from(attendances)
        .where(eq(attendances.userId, userId))
        .orderBy(desc(attendances.validatedAt))
        .limit(20),
    [],
  );
  const xpStats = await safe(() => getUserStats(userId), null);

  const cleanName = cleanDisplayName(userRow?.name);
  const memberSince = userRow?.createdAt
    ? userRow.createdAt
        .toLocaleDateString("ro-RO", { month: "short", year: "numeric" })
        .toUpperCase()
    : null;

  const data: ProfileViewData = {
    name: cleanName ?? "Membru MUEVE",
    initials: initials(cleanName, null),
    email: userRow?.email ?? "",
    memberSince,
    tier: xpStats ? { name: xpStats.tier.name, level: xpStats.tier.level } : null,
    xp: xpStats?.xp ?? 0,
    wallet: {
      appleEnabled: appleWalletEnabled(),
      googleEnabled: googleWalletEnabled(),
      added: !!userRow?.walletAddedAt,
    },
    activeSub: activeSub
      ? {
          planName: activeSub.planName,
          status: activeSub.status,
          periodEnd: activeSub.currentPeriodEnd
            ? activeSub.currentPeriodEnd.toLocaleDateString("ro-RO")
            : null,
        }
      : null,
    creditsTotal: credits.total,
    recentPayments: recentPayments.map((p) => ({
      id: p.id,
      label: p.planName || p.mode || "Plată",
      amount: `${(p.amount / 100).toFixed(2)} ${p.currency.toUpperCase()}`,
    })),
    attendance: attendanceHistory.map((r) => ({
      slotId: r.slotId,
      slotDate: r.slotDate,
      validatedAt: r.validatedAt.toISOString(),
      method: r.method,
    })),
  };

  return <ProfileView data={data} />;
}
