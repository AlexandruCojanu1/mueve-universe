import { auth } from "@/auth";
import { db } from "@/db";
import { subscriptions, payments, users, attendances } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import DashboardHomeView, {
  type DashboardHomeData,
} from "@/components/dashboard/DashboardHomeView";
import { cleanDisplayName } from "@/lib/display-name";
import { appleWalletEnabled } from "@/lib/wallet/apple";
import { googleWalletEnabled } from "@/lib/wallet/google";
import { getProgramData } from "@/lib/coach-schedule";
import { upcomingSessions } from "@/lib/user-stats";
import { isoDate } from "@/lib/coach-schedule";
import { getCreditBalance } from "@/lib/credits";
import { readDeviceBinding } from "@/lib/device-binding";
import { getLeaderboard, getUserStats } from "@/lib/leaderboard";

export const dynamic = "force-dynamic";

const DAYS_RO = ["DUMINICA", "LUNI", "MARTI", "MIERCURI", "JOI", "VINERI", "SAMBATA"];
const WEEK_LETTERS = ["L", "M", "M", "J", "V", "S", "D"];

function initials(name: string | null | undefined): string {
  const src = (name || "").trim();
  if (!src) return "M";
  const parts = src.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return src.slice(0, 2).toUpperCase();
}

function slotDateTime(dateStr: string, time: string): Date {
  const [h, m] = time.split(":").map((n) => parseInt(n, 10) || 0);
  const dt = new Date(`${dateStr}T00:00:00`);
  dt.setHours(h, m, 0, 0);
  return dt;
}

export default async function DashboardHome({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string; strava?: string }>;
}) {
  const sp = await searchParams;
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const safe = async <T,>(label: string, fn: () => Promise<T>, fallback: T): Promise<T> => {
    try {
      return await fn();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(`[dashboard] ${label} failed:`, e);
      return fallback;
    }
  };

  const deviceCheck = await safe(
    "readDeviceBinding",
    () => readDeviceBinding(userId),
    { ok: true as const, firstBind: false },
  );

  const userRow = (await safe(
    "users select",
    () => db.select().from(users).where(eq(users.id, userId)).limit(1),
    [],
  ))[0];

  const program = await safe("getProgramData", () => getProgramData(), null);

  const recentPayments = await safe(
    "payments select",
    () =>
      db
        .select()
        .from(payments)
        .where(eq(payments.userId, userId))
        .orderBy(desc(payments.createdAt))
        .limit(5),
    [],
  );
  const activeSubRows = await safe(
    "subscriptions select",
    () =>
      db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, userId))
        .orderBy(desc(subscriptions.updatedAt))
        .limit(1),
    [],
  );
  const credits = await safe(
    "getCreditBalance",
    () => getCreditBalance(userId),
    { total: 0, nextExpiry: null } as Awaited<ReturnType<typeof getCreditBalance>>,
  );
  const attendanceHistory = await safe(
    "attendance history",
    () =>
      db
        .select()
        .from(attendances)
        .where(eq(attendances.userId, userId))
        .orderBy(desc(attendances.validatedAt))
        .limit(20),
    [],
  );
  const xpStats = await safe("getUserStats", () => getUserStats(userId), null);
  const board = await safe("getLeaderboard", () => getLeaderboard(userId, 10), []);

  const activeSub = activeSubRows[0];

  // ── Derived view data ──────────────────────────────────────────────
  const now = new Date();
  const today = DAYS_RO[now.getDay()];
  const todayIso = isoDate(now);
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const tomorrowIso = isoDate(tomorrow);

  const cleanName = cleanDisplayName(userRow?.name);
  const needsName = deviceCheck.ok && !cleanName;
  const firstName = (cleanName ?? "").split(" ")[0] || "Runner";

  const myRank = board.find((b) => b.isMe)?.rank ?? null;

  // Next session: the soonest slot whose start time hasn't passed yet.
  const upcomingAll = program ? upcomingSessions(program, 7) : [];
  const nextUp =
    upcomingAll.find((u) => slotDateTime(u.date, u.slot.time) >= now) ??
    upcomingAll[0] ??
    null;

  const dayWord = nextUp
    ? nextUp.date === todayIso
      ? "AZI"
      : nextUp.date === tomorrowIso
        ? "MÂINE"
        : (nextUp.dayLabel || "").toUpperCase()
    : "";

  const nextSession: DashboardHomeData["nextSession"] = nextUp
    ? {
        dayWord,
        time: nextUp.slot.time,
        activity: nextUp.slot.activity.ro,
        world: nextUp.slot.world.ro,
        color: nextUp.slot.color,
        spotsLabel: null,
      }
    : null;

  // Weekly attendance — distinct days attended in the current Mon–Sun week.
  const slotToday = (now.getDay() + 6) % 7; // 0=Mon..6=Sun
  const monday = new Date(now);
  monday.setDate(now.getDate() - slotToday);
  monday.setHours(0, 0, 0, 0);
  const attendedSet = new Set(attendanceHistory.map((r) => r.slotDate));
  const weekAttended: boolean[] = [];
  let weekCount = 0;
  for (let i = 0; i < 7; i++) {
    const dt = new Date(monday);
    dt.setDate(monday.getDate() + i);
    const on = attendedSet.has(isoDate(dt));
    weekAttended.push(on);
    if (on) weekCount++;
  }

  const crew = board
    .filter((b) => !b.isMe)
    .slice(0, 4)
    .map((b) => {
      const nm = cleanDisplayName(b.name);
      return { name: (nm ?? "Membru").split(" ")[0], initials: initials(nm) };
    });

  const data: DashboardHomeData = {
    today,
    firstName,
    initials: initials(cleanName),
    needsName,
    checkoutStatus: sp.checkout,
    deviceBlocked: !deviceCheck.ok && deviceCheck.reason === "permanently_blocked",
    deviceMismatch: !deviceCheck.ok && deviceCheck.reason === "device_mismatch",

    nextSession,
    streakWeeks: xpStats?.currentStreak ?? 0,
    week: { letters: WEEK_LETTERS, attended: weekAttended, count: weekCount },
    crew,

    stats: {
      runs: xpStats?.runs ?? 0,
      xp: xpStats?.xp ?? 0,
      streakWeeks: xpStats?.currentStreak ?? 0,
      rank: myRank,
    },
    progress: xpStats
      ? {
          tierName: xpStats.tier.name,
          nextTierName: xpStats.nextTier?.name ?? null,
          xpToGo: xpStats.nextTier ? xpStats.nextTier.minXp - xpStats.xp : 0,
          pct: Math.round(xpStats.progressToNext * 100),
        }
      : null,

    upcoming: upcomingAll.slice(0, 4).map((u) => ({
      id: `${u.date}-${u.slot.id}`,
      title: u.slot.activity.ro,
      meta: `${u.dayLabel} · ${u.date.slice(5).replace("-", ".")} · ${u.slot.time}`,
      world: u.slot.world.ro,
    })),

    wallet: { appleEnabled: appleWalletEnabled(), googleEnabled: googleWalletEnabled() },
    showStrava: !userRow?.stravaAthleteId,
    strava: {
      athleteName: userRow?.stravaAthleteName ?? null,
      lastSync: userRow?.stravaLastSyncAt ? userRow.stravaLastSyncAt.toISOString() : null,
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

  return <DashboardHomeView data={data} />;
}
