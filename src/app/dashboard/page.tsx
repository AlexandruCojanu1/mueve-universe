import Link from "next/link";
import { auth } from "@/auth";
import { db } from "@/db";
import { subscriptions, payments, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import ManageSubscription from "@/components/dashboard/ManageSubscription";
import CheckoutBanner from "@/components/dashboard/CheckoutBanner";
import { getProgramData } from "@/lib/coach-schedule";
import {
  computeUserStats,
  computeWorldBreakdown,
  upcomingSessions,
} from "@/lib/user-stats";

export const dynamic = "force-dynamic";

export default async function DashboardHome({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const sp = await searchParams;
  const session = await auth();
  const name = session?.user?.name || session?.user?.email;
  const userId = session?.user?.id;

  if (!userId) return null;

  const [userRow] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const program = await getProgramData();

  const [stats, worldRows, recentPayments, activeSubRows] = await Promise.all([
    computeUserStats(userId),
    computeWorldBreakdown(userId, program),
    db
      .select()
      .from(payments)
      .where(eq(payments.userId, userId))
      .orderBy(desc(payments.createdAt))
      .limit(5),
    db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .orderBy(desc(subscriptions.updatedAt))
      .limit(1),
  ]);

  const activeSub = activeSubRows[0];
  const upcoming = upcomingSessions(program, 7).slice(0, 4);
  const favSlot = program?.slots.find((s) => s.id === stats.favoriteSlot?.slotId);

  const worldTotal = worldRows.reduce((a, b) => a + b.count, 0);
  const memberSince = userRow?.createdAt
    ? userRow.createdAt.toLocaleDateString("ro-RO", {
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="space-y-8">
      <CheckoutBanner status={sp.checkout} />
      <header>
        <h1 className="text-3xl font-black uppercase tracking-tight">Bună, {name}</h1>
        {memberSince && (
          <p className="opacity-60 mt-2 text-sm">Membru din {memberSince}</p>
        )}
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total sesiuni" value={stats.total} />
        <StatCard label="Luna asta" value={stats.thisMonth} />
        <StatCard label="Streak" value={stats.streakDays} suffix={stats.streakDays === 1 ? "zi" : "zile"} />
        <StatCard
          label="Favorit"
          value={favSlot?.activity.ro ?? "—"}
          isText
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-lg p-6 space-y-3">
          <div className="text-xs uppercase tracking-widest font-bold opacity-60">Plan activ</div>
          {activeSub ? (
            <>
              <div className="text-lg font-black">{activeSub.planName || "Abonament"}</div>
              <div className="text-xs opacity-60">
                Status: <span className="uppercase tracking-wider">{activeSub.status}</span>
                {activeSub.currentPeriodEnd && (
                  <> · până la {activeSub.currentPeriodEnd.toLocaleDateString("ro-RO")}</>
                )}
              </div>
              <ManageSubscription />
            </>
          ) : (
            <>
              <div className="text-lg">Fără abonament activ</div>
              <Link
                href="/#pricing"
                className="inline-block text-xs uppercase tracking-widest font-bold text-[var(--sun)] hover:opacity-80"
              >
                Vezi prețurile →
              </Link>
            </>
          )}
        </div>

        <div className="bg-white/5 border border-white/10 rounded-lg p-6 space-y-3">
          <div className="text-xs uppercase tracking-widest font-bold opacity-60">
            Plăți recente
          </div>
          {recentPayments.length === 0 ? (
            <div className="text-sm opacity-60">Încă nicio plată.</div>
          ) : (
            <ul className="text-sm space-y-1">
              {recentPayments.map((p) => (
                <li key={p.id} className="flex items-center justify-between">
                  <span>{p.planName || p.mode}</span>
                  <span className="opacity-70">
                    {(p.amount / 100).toFixed(2)} {p.currency.toUpperCase()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-lg p-6 space-y-4">
          <div className="text-xs uppercase tracking-widest font-bold opacity-60">
            Pe lumi
          </div>
          {worldRows.length === 0 ? (
            <div className="text-sm opacity-60">Fără date încă — marchează prima prezență.</div>
          ) : (
            <ul className="space-y-2">
              {worldRows.map((w) => {
                const pct = worldTotal > 0 ? Math.round((w.count / worldTotal) * 100) : 0;
                return (
                  <li key={w.world} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-bold">{w.world}</span>
                      <span className="opacity-60 text-xs">
                        {w.count} · {pct}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[var(--sun)]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="bg-white/5 border border-white/10 rounded-lg p-6 space-y-3">
          <div className="text-xs uppercase tracking-widest font-bold opacity-60">
            Următoarele sesiuni
          </div>
          {upcoming.length === 0 ? (
            <div className="text-sm opacity-60">Nicio sesiune în următoarele 7 zile.</div>
          ) : (
            <ul className="text-sm divide-y divide-white/5">
              {upcoming.map((u) => (
                <li
                  key={`${u.date}-${u.slot.id}`}
                  className="flex items-center justify-between py-2"
                >
                  <div>
                    <div className="font-bold">{u.slot.activity.ro}</div>
                    <div className="text-xs opacity-60">
                      {u.dayLabel} · {u.date.slice(5).replace("-", ".")} · {u.slot.time} · {u.slot.world.ro}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/#prog"
            className="inline-block text-xs uppercase tracking-widest font-bold text-[var(--sun)] hover:opacity-80"
          >
            Programul complet →
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  suffix,
  isText,
}: {
  label: string;
  value: string | number;
  suffix?: string;
  isText?: boolean;
}) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-5 space-y-2">
      <div className="text-[10px] uppercase tracking-widest font-bold opacity-50">{label}</div>
      <div className={isText ? "text-base font-bold" : "text-3xl font-black text-[var(--sun)]"}>
        {value}
        {suffix && <span className="text-xs opacity-60 ml-2 font-bold">{suffix}</span>}
      </div>
    </div>
  );
}
