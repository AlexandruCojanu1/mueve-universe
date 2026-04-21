import Link from "next/link";
import { auth } from "@/auth";
import { db } from "@/db";
import { subscriptions, payments, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import ManageSubscription from "@/components/dashboard/ManageSubscription";
import CheckoutBanner from "@/components/dashboard/CheckoutBanner";
import AutoCheckout from "@/components/dashboard/AutoCheckout";
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
    <>
      <AutoCheckout />
      <CheckoutBanner status={sp.checkout} />

      <section className="dash-welcome">
        <div className="dash-welcome-eyebrow">Universul tău</div>
        <h1 className="dash-welcome-title">Bună, {name}</h1>
        <p className="dash-welcome-sub">
          {memberSince
            ? `Membru din ${memberSince}. Continuă ritualul — rezervări, sesiuni, wallet.`
            : "Continuă ritualul — rezervări, sesiuni, wallet."}
        </p>
      </section>

      <section className="dash-section">
        <div className="dash-section-head">
          <h2 className="dash-section-title">Statistici</h2>
        </div>
        <div className="dash-grid-4">
          <StatCard label="Total sesiuni" value={stats.total} />
          <StatCard label="Luna asta" value={stats.thisMonth} />
          <StatCard
            label="Streak"
            value={stats.streakDays}
            suffix={stats.streakDays === 1 ? "zi" : "zile"}
          />
          <StatCard label="Favorit" value={favSlot?.activity.ro ?? "—"} isText />
        </div>
      </section>

      <section className="dash-section">
        <div className="dash-grid-2">
          <div className="dash-card">
            <div className="dash-card-label">Plan activ</div>
            {activeSub ? (
              <>
                <div className="dash-card-value">
                  {activeSub.planName || "Abonament"}
                </div>
                <div className="dash-card-meta">
                  Status:{" "}
                  <span style={{ textTransform: "uppercase", letterSpacing: "0.1em" }}>
                    {activeSub.status}
                  </span>
                  {activeSub.currentPeriodEnd && (
                    <> · până la {activeSub.currentPeriodEnd.toLocaleDateString("ro-RO")}</>
                  )}
                </div>
                <ManageSubscription />
              </>
            ) : (
              <>
                <div className="dash-card-value">Fără abonament activ</div>
                <Link href="/#pricing" className="dash-link">
                  Vezi prețurile →
                </Link>
              </>
            )}
          </div>

          <div className="dash-card">
            <div className="dash-card-label">Plăți recente</div>
            {recentPayments.length === 0 ? (
              <div className="dash-card-meta">Încă nicio plată.</div>
            ) : (
              <ul className="dash-list">
                {recentPayments.map((p) => (
                  <li key={p.id} className="dash-list-row">
                    <div className="dash-list-row-main">
                      <span className="dash-list-row-title">
                        {p.planName || p.mode}
                      </span>
                    </div>
                    <span className="dash-list-row-side">
                      {(p.amount / 100).toFixed(2)} {p.currency.toUpperCase()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      <section className="dash-section">
        <div className="dash-grid-2">
          <div className="dash-card">
            <div className="dash-card-label">Pe lumi</div>
            {worldRows.length === 0 ? (
              <div className="dash-card-meta">
                Fără date încă — marchează prima prezență.
              </div>
            ) : (
              <ul className="dash-list" style={{ gap: "0.25rem" }}>
                {worldRows.map((w) => {
                  const pct =
                    worldTotal > 0 ? Math.round((w.count / worldTotal) * 100) : 0;
                  return (
                    <li key={w.world} className="dash-bar-row">
                      <div className="dash-bar-head">
                        <span className="dash-bar-label">{w.world}</span>
                        <span className="dash-bar-value">
                          {w.count} · {pct}%
                        </span>
                      </div>
                      <div className="dash-bar-track">
                        <div
                          className="dash-bar-fill"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="dash-card">
            <div className="dash-card-label">Următoarele sesiuni</div>
            {upcoming.length === 0 ? (
              <div className="dash-card-meta">
                Nicio sesiune în următoarele 7 zile.
              </div>
            ) : (
              <ul className="dash-list">
                {upcoming.map((u) => (
                  <li key={`${u.date}-${u.slot.id}`} className="dash-list-row">
                    <div className="dash-list-row-main">
                      <span className="dash-list-row-title">
                        {u.slot.activity.ro}
                      </span>
                      <span className="dash-list-row-meta">
                        {u.dayLabel} · {u.date.slice(5).replace("-", ".")} ·{" "}
                        {u.slot.time} · {u.slot.world.ro}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/#prog" className="dash-link" style={{ marginTop: "0.3rem" }}>
              Programul complet →
            </Link>
          </div>
        </div>
      </section>
    </>
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
    <div className="dash-stat">
      <div className="dash-stat-label">{label}</div>
      <div className={isText ? "dash-stat-value-text" : "dash-stat-value"}>
        {value}
        {suffix && <span className="dash-stat-suffix">{suffix}</span>}
      </div>
    </div>
  );
}
