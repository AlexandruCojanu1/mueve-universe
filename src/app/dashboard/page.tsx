import Link from "next/link";
import { auth } from "@/auth";
import { db } from "@/db";
import { subscriptions, payments, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import ManageSubscription from "@/components/dashboard/ManageSubscription";
import CheckoutBanner from "@/components/dashboard/CheckoutBanner";
import AutoCheckout from "@/components/dashboard/AutoCheckout";
import StravaCard from "@/components/dashboard/StravaCard";
import { getProgramData } from "@/lib/coach-schedule";
import {
  computeUserStats,
  computeWorldBreakdown,
  upcomingSessions,
} from "@/lib/user-stats";
import { getCreditBalance } from "@/lib/credits";
import {
  getActivity,
  getChallenges,
  getLeaderboard,
  getUserStats,
} from "@/lib/leaderboard";

export const dynamic = "force-dynamic";

const NICE_TIME = new Intl.DateTimeFormat("ro-RO", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

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

  const [
    stats,
    worldRows,
    recentPayments,
    activeSubRows,
    credits,
    xpStats,
    board,
    challenges,
    activity,
  ] = await Promise.all([
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
    getCreditBalance(userId),
    getUserStats(userId),
    getLeaderboard(userId, 10),
    getChallenges(userId),
    getActivity(userId, 8),
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
  const stravaConnected = !!userRow?.stravaAthleteId;
  const stravaAthleteName = userRow?.stravaAthleteName ?? null;
  const stravaLastSync = userRow?.stravaLastSyncAt ?? null;

  return (
    <>
      <AutoCheckout />
      <CheckoutBanner status={sp.checkout} />

      <section className="dash-welcome">
        <div className="dash-welcome-eyebrow">Universul tău</div>
        <h1 className="dash-welcome-title">Bună, {name}</h1>
        <p className="dash-welcome-sub">
          {memberSince
            ? `Membru din ${memberSince}. Continuă ritualul — atingi NFC-ul, te înregistrezi, primești XP.`
            : "Continuă ritualul — atingi NFC-ul, te înregistrezi, primești XP."}
        </p>
      </section>

      {/* ── XP & Tier ─────────────────────────────────────────────────── */}
      <section className="dash-section" id="xp">
        <div className="dash-section-head">
          <h2 className="dash-section-title">XP &amp; nivel</h2>
        </div>
        <div className="lb-card lb-me">
          <div className="lb-me-row">
            <div>
              <div className="lb-me-tier">{xpStats.tier.name}</div>
              <div className="lb-me-name">{session?.user?.name || "Tu"}</div>
            </div>
            <div className="lb-me-level">LVL {xpStats.tier.level}</div>
          </div>
          <div className="lb-xp-bar">
            <div
              className="lb-xp-bar-fill"
              style={{ width: `${Math.round(xpStats.progressToNext * 100)}%` }}
            />
          </div>
          <div className="lb-xp-meta">
            <span>{xpStats.xp} XP</span>
            <span>
              {xpStats.nextTier
                ? `${xpStats.nextTier.minXp - xpStats.xp} XP până la ${xpStats.nextTier.name}`
                : "Nivel maxim — Legend"}
            </span>
          </div>
          <div className="lb-stats-row">
            <div className="lb-stat">
              <div className="lb-stat-value">{xpStats.runs}</div>
              <div className="lb-stat-label">Sesiuni</div>
            </div>
            <div className="lb-stat">
              <div className="lb-stat-value">{xpStats.currentStreak}sapt</div>
              <div className="lb-stat-label">Streak curent</div>
            </div>
            <div className="lb-stat">
              <div className="lb-stat-value">{xpStats.longestStreak}sapt</div>
              <div className="lb-stat-label">Cel mai lung</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Leaderboard + Challenges ──────────────────────────────────── */}
      <section className="dash-section" id="leaderboard">
        <div className="dash-section-head">
          <h2 className="dash-section-title">Clasament &amp; challenges</h2>
        </div>
        <div className="lb-grid">
          <div className="lb-card lb-board">
            <div className="lb-card-head">
              <span>Top runners</span>
              <span className="lb-card-meta">Top {board.length}</span>
            </div>
            <ol className="lb-list">
              {board.map((e) => (
                <li
                  key={e.userId}
                  className={"lb-row" + (e.isMe ? " lb-row-me" : "")}
                >
                  <span className="lb-rank">#{e.rank}</span>
                  <span className="lb-name">{e.name}</span>
                  <span className="lb-row-meta">
                    <span className="lb-row-runs">{e.runs} ses</span>
                    <span className="lb-row-streak">{e.streak}sapt</span>
                    <span className="lb-row-xp">{e.xp} XP</span>
                  </span>
                </li>
              ))}
              {board.length === 0 && (
                <li className="lb-empty">Niciun runner încă. Fii primul.</li>
              )}
            </ol>
          </div>
          <div className="lb-card lb-challenges">
            <div className="lb-card-head">
              <span>Săptămâna asta</span>
              <span className="lb-card-meta">+50 XP fiecare</span>
            </div>
            <ul className="lb-ch-list">
              {challenges.map((c) => (
                <li key={c.id} className={"lb-ch" + (c.done ? " lb-ch-done" : "")}>
                  <div className="lb-ch-head">
                    <span className="lb-ch-title">{c.title}</span>
                    <span className="lb-ch-reward">
                      {c.done ? `✓ +${c.reward} XP` : `+${c.reward} XP`}
                    </span>
                  </div>
                  <div className="lb-ch-body">{c.description}</div>
                  <div className="lb-ch-bar">
                    <div
                      className="lb-ch-bar-fill"
                      style={{ width: `${Math.round(c.progress * 100)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── Stats originale ───────────────────────────────────────────── */}
      <section className="dash-section">
        <div className="dash-grid-4">
          <StatCard
            label="Clase rămase"
            value={credits.total}
            suffix={credits.total === 1 ? "clasă" : "clase"}
          />
          <StatCard label="Luna asta" value={stats.thisMonth} />
          <StatCard
            label="Streak zile"
            value={stats.streakDays}
            suffix={stats.streakDays === 1 ? "zi" : "zile"}
          />
          <StatCard label="Favorit" value={favSlot?.activity.ro ?? "—"} isText />
        </div>
      </section>

      {/* ── Pass + Plăți ──────────────────────────────────────────────── */}
      <section className="dash-section">
        <div className="dash-grid-2">
          <div className="dash-card">
            <div className="dash-card-label">Pass</div>
            {activeSub ? (
              <>
                <div className="dash-card-value">
                  {activeSub.planName || "Pass activ"}
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
                <div className="dash-card-meta">
                  {credits.total > 0
                    ? `${credits.total} ${credits.total === 1 ? "clasă rămasă" : "clase rămase"}${
                        credits.nextExpiry
                          ? ` · expiră ${credits.nextExpiry.toLocaleDateString("ro-RO")}`
                          : ""
                      }`
                    : "Nicio clasă cumpărată încă."}
                </div>
                <Link href="/#pricing" className="dash-link">
                  Cumpără clase →
                </Link>
                <ManageSubscription />
              </>
            ) : (
              <>
                <div className="dash-card-value">Fără Pass activ</div>
                <div className="dash-card-meta">
                  Ai nevoie de Pass ca să cumperi clase și să intri la sesiuni.
                </div>
                <Link href="/#pricing" className="dash-link">
                  Vezi Pass-ul →
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

      {/* ── Pe lumi + Sesiuni viitoare ───────────────────────────────── */}
      <section className="dash-section" id="sessions">
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

      {/* ── Activity feed ────────────────────────────────────────────── */}
      <section className="dash-section">
        <div className="dash-section-head">
          <h2 className="dash-section-title">Activitate recentă</h2>
        </div>
        <div className="lb-card">
          <ul className="lb-act-list">
            {activity.length === 0 && (
              <li className="lb-empty">Niciun XP încă. Vino la o sesiune.</li>
            )}
            {activity.map((a) => (
              <li key={a.id} className="lb-act">
                <span className="lb-act-label">{a.label}</span>
                <span className="lb-act-when">{NICE_TIME.format(a.at)}</span>
                <span className="lb-act-xp">+{a.xp}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Strava ───────────────────────────────────────────────────── */}
      <section className="dash-section" id="strava">
        <div className="dash-section-head">
          <h2 className="dash-section-title">Strava</h2>
          <span className="dash-section-meta">+10 XP / km la alergările sincronizate</span>
        </div>
        <StravaCard
          connected={stravaConnected}
          athleteName={stravaAthleteName}
          lastSync={stravaLastSync ? stravaLastSync.toISOString() : null}
        />
      </section>

      {/* ── NFC how-it-works ─────────────────────────────────────────── */}
      <section className="lb-nfc">
        <h2 className="lb-nfc-title">Cum funcționează NFC check-in</h2>
        <ol className="lb-nfc-steps">
          <li>Punem un sticker NFC Mueve la locul de meetup.</li>
          <li>Atingi telefonul de sticker la sosire.</li>
          <li>Se deschide automat Mueve, te-am autentificat deja.</li>
          <li>Prezența + XP se înregistrează instant.</li>
        </ol>
        <p className="lb-nfc-hint">
          Conectează-ți și Strava ca să primești XP automat pentru alergările
          tale, oricând și oriunde.
        </p>
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
