import { auth } from "@/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { subscriptions, payments, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import CheckoutBanner from "@/components/dashboard/CheckoutBanner";
import AutoCheckout from "@/components/dashboard/AutoCheckout";
import WalletButtons from "@/components/dashboard/WalletButtons";
import AutoRotateQr from "@/components/dashboard/AutoRotateQr";
import StravaCard from "@/components/dashboard/StravaCard";
import ManageSubscription from "@/components/dashboard/ManageSubscription";
import { getProgramData } from "@/lib/coach-schedule";
import { upcomingSessions } from "@/lib/user-stats";
import { getCreditBalance, getActivePassRow } from "@/lib/credits";
import { issueDynamicToken } from "@/lib/qr-dynamic";
import { readDeviceBinding } from "@/lib/device-binding";
import {
  getActivity,
  getChallenges,
  getLeaderboard,
  getUserStats,
} from "@/lib/leaderboard";

export const dynamic = "force-dynamic";

const NICE_AGO = (d: Date): string => {
  const diff = Date.now() - d.getTime();
  const h = Math.floor(diff / 3_600_000);
  if (h < 1) {
    const m = Math.max(1, Math.floor(diff / 60_000));
    return `${m}m`;
  }
  if (h < 24) return `${h}h`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}z`;
  const wk = Math.floor(days / 7);
  return `${wk}sapt`;
};

const DAYS_RO = ["DUMINICA", "LUNI", "MARTI", "MIERCURI", "JOI", "VINERI", "SAMBATA"];

function initials(name: string | null | undefined, email: string | null | undefined): string {
  const src = (name || email || "").trim();
  if (!src) return "M";
  const parts = src.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return src.slice(0, 2).toUpperCase();
}

export default async function DashboardHome({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string; strava?: string }>;
}) {
  const sp = await searchParams;
  const session = await auth();
  const name = session?.user?.name || session?.user?.email || "";
  const userId = session?.user?.id;

  if (!userId) return null;

  const hdrs = await headers();
  const host = hdrs.get("x-forwarded-host") || hdrs.get("host") || "";
  const proto = hdrs.get("x-forwarded-proto") || "https";
  const origin = process.env.NEXTAUTH_URL || (host ? `${proto}://${host}` : "");

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
  const initialQr = deviceCheck.ok
    ? issueDynamicToken(userId)
    : { token: "", expiresAt: Date.now() };

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
  const pass = await safe("getActivePassRow", () => getActivePassRow(userId), null);
  const xpStats = await safe("getUserStats", () => getUserStats(userId), null);
  const board = await safe("getLeaderboard", () => getLeaderboard(userId, 10), []);
  const challenges = await safe("getChallenges", () => getChallenges(userId), []);
  const activity = await safe("getActivity", () => getActivity(userId, 8), []);

  const activeSub = activeSubRows[0];
  const upcoming = program ? upcomingSessions(program, 7).slice(0, 4) : [];

  const stravaConnected = !!userRow?.stravaAthleteId;
  const stravaAthleteName = userRow?.stravaAthleteName ?? null;
  const stravaLastSync = userRow?.stravaLastSyncAt ?? null;

  const me = board.find((b) => b.isMe);
  const myRank = me?.rank ?? null;

  const today = DAYS_RO[new Date().getDay()];
  const firstName = (session?.user?.name || "").split(" ")[0] || "Runner";
  const initialsStr = initials(session?.user?.name, session?.user?.email);

  return (
    <>
      <AutoCheckout />
      <CheckoutBanner status={sp.checkout} />

      {/* ── Hello ─────────────────────────────────────────────────────── */}
      <header className="m-hello">
        <div>
          <div className="m-hello-eyebrow">{today} CREW</div>
          <h1 className="m-hello-name">Hey, {firstName} 👋</h1>
        </div>
        <div className="m-avatar">{initialsStr}</div>
      </header>

      {/* ── Hero XP card ─────────────────────────────────────────────── */}
      {xpStats && (
        <section className="m-hero-xp" id="xp">
          <div className="m-hero-xp-row">
            <div className="m-hero-xp-tier">
              LVL {xpStats.tier.level} · {xpStats.tier.name.toUpperCase()}
            </div>
            <div className="m-streak-badge">
              <span className="m-streak-icon">🔥</span>
              <span>{xpStats.currentStreak} WKS</span>
            </div>
          </div>
          <div className="m-hero-xp-amount">
            {xpStats.xp}
            <span className="m-hero-xp-unit">XP</span>
          </div>
          <div className="m-hero-xp-foot">
            <span>
              {xpStats.nextTier
                ? `→ ${xpStats.nextTier.name}`
                : "→ Nivel maxim"}
            </span>
            <span>
              {xpStats.nextTier
                ? `${xpStats.nextTier.minXp - xpStats.xp} XP to go`
                : "Legend"}
            </span>
          </div>
          <div className="m-hero-xp-bar">
            <div
              className="m-hero-xp-bar-fill"
              style={{ width: `${Math.round(xpStats.progressToNext * 100)}%` }}
            />
          </div>
        </section>
      )}

      {/* ── Action tiles ─────────────────────────────────────────────── */}
      <section className="m-actions" id="actions">
        <a href="#card" className="m-action m-action-yellow">
          <div className="m-action-icon">📡</div>
          <div className="m-action-label">NFC / QR Check-In</div>
          <div className="m-action-meta">+80 XP · arată cardul</div>
        </a>
        <a
          href={stravaConnected ? "#strava" : "/api/strava/connect"}
          className="m-action m-action-orange"
        >
          <div className="m-action-icon">🔥</div>
          <div className="m-action-label">
            {stravaConnected ? "Log Strava Run" : "Connect Strava"}
          </div>
          <div className="m-action-meta">
            {stravaConnected ? "+10 XP / km · sync" : "+10 XP / km · auto"}
          </div>
        </a>
      </section>

      {/* ── Stat tiles ───────────────────────────────────────────────── */}
      {xpStats && (
        <section className="m-stats">
          <div className="m-stat-tile">
            <div className="m-stat-emoji">🏃</div>
            <div className="m-stat-value">{xpStats.runs}</div>
            <div className="m-stat-label">Runs</div>
          </div>
          <div className="m-stat-tile">
            <div className="m-stat-emoji">🔥</div>
            <div className="m-stat-value">{xpStats.currentStreak}wk</div>
            <div className="m-stat-label">Streak</div>
          </div>
          <div className="m-stat-tile">
            <div className="m-stat-emoji">📊</div>
            <div className="m-stat-value">{myRank ? `#${myRank}` : "—"}</div>
            <div className="m-stat-label">Rank</div>
          </div>
        </section>
      )}

      {/* ── Crew activity ────────────────────────────────────────────── */}
      <section className="m-crew" id="leaderboard">
        <div className="m-section-eyebrow">CREW ACTIVITY</div>
        <ul className="m-crew-list">
          {activity.length === 0 && (
            <li className="m-crew-empty">Niciun XP încă. Vino la o sesiune.</li>
          )}
          {activity.slice(0, 6).map((a) => {
            const who = a.label.startsWith("Strava")
              ? "Tu"
              : (session?.user?.name || "Tu").split(" ")[0];
            const kind = a.label.startsWith("Strava")
              ? "logged a run"
              : `checked in · ${a.label.toLowerCase()}`;
            return (
              <li key={a.id} className="m-crew-row">
                <div className="m-crew-avatar">{initials(who, "")}</div>
                <div className="m-crew-main">
                  <div className="m-crew-line">
                    <strong>{who}</strong>{" "}
                    <span className="m-crew-action">{kind}</span>
                  </div>
                  <div className="m-crew-meta">{NICE_AGO(a.at)} ago</div>
                </div>
                <div className="m-crew-xp">+{a.xp}</div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* ── Leaderboard top ──────────────────────────────────────────── */}
      <section className="m-board" id="board">
        <div className="m-section-eyebrow">LEADERBOARD</div>
        <ul className="m-board-list">
          {board.length === 0 && (
            <li className="m-crew-empty">Niciun runner încă.</li>
          )}
          {board.slice(0, 10).map((e) => (
            <li
              key={e.userId}
              className={"m-board-row" + (e.isMe ? " m-board-row-me" : "")}
            >
              <span className="m-board-rank">#{e.rank}</span>
              <span className="m-board-avatar">
                {initials(e.name, e.email)}
              </span>
              <span className="m-board-name">{e.name}</span>
              <span className="m-board-meta">
                {e.runs} runs · {e.streak}wk
              </span>
              <span className="m-board-xp">{e.xp}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* ── Quests ───────────────────────────────────────────────────── */}
      {challenges.length > 0 && (
        <section className="m-quests" id="quests">
          <div className="m-section-eyebrow">QUESTS · SĂPTĂMÂNA ASTA</div>
          <ul className="m-quests-list">
            {challenges.map((c) => (
              <li
                key={c.id}
                className={"m-quest" + (c.done ? " m-quest-done" : "")}
              >
                <div className="m-quest-head">
                  <span className="m-quest-title">{c.title}</span>
                  <span className="m-quest-reward">
                    {c.done ? `✓ +${c.reward}` : `+${c.reward}`} XP
                  </span>
                </div>
                <div className="m-quest-body">{c.description}</div>
                <div className="m-quest-bar">
                  <div
                    className="m-quest-bar-fill"
                    style={{ width: `${Math.round(c.progress * 100)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── Card cu QR rotativ ───────────────────────────────────────── */}
      <section className="m-card-section" id="card">
        <div className="m-section-eyebrow">CARDUL MEU · COD ROTATIV</div>
        {!deviceCheck.ok && (
          <div className="m-banner-err">
            Acest cont a fost legat de alt dispozitiv. Loghează-te pe
            telefonul original sau cere admin reset.
          </div>
        )}
        <div className="dash-qr-card">
          <div className="dash-qr-head">
            <div>
              <div className="dash-qr-eyebrow">Member Card</div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/mueve-logo.png" alt="MUEVE" className="dash-qr-logo" />
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="m-card-pill">{credits.total} clase</div>
            </div>
          </div>
          <AutoRotateQr
            origin={origin}
            initialToken={initialQr.token}
            initialExpiresAt={initialQr.expiresAt}
          />
          <div className="dash-qr-foot">
            <div className="dash-qr-foot-name">{session?.user?.name || "Membru"}</div>
            <div className="dash-qr-foot-email">{session?.user?.email}</div>
            <div className="m-card-pass">
              {pass
                ? `Pass activ${pass.currentPeriodEnd ? ` · până la ${pass.currentPeriodEnd.toLocaleDateString("ro-RO")}` : ""}`
                : "Fără Pass activ"}
            </div>
          </div>
        </div>
      </section>

      {/* ── Wallet ───────────────────────────────────────────────────── */}
      <section className="m-card-section" id="wallet">
        <div className="m-section-eyebrow">WALLET DIGITAL · APPLE · GOOGLE</div>
        <WalletButtons />
      </section>

      {/* ── Strava ───────────────────────────────────────────────────── */}
      <section className="m-card-section" id="strava">
        <div className="m-section-eyebrow">STRAVA · ALERGĂRILE TALE</div>
        <StravaCard
          connected={stravaConnected}
          athleteName={stravaAthleteName}
          lastSync={stravaLastSync ? stravaLastSync.toISOString() : null}
        />
      </section>

      {/* ── Pass + payments ──────────────────────────────────────────── */}
      <section className="m-card-section" id="pass">
        <div className="m-section-eyebrow">PASS · PLĂȚI</div>
        <div className="m-grid-2">
          <div className="m-mini-card">
            <div className="m-mini-label">PASS</div>
            {activeSub ? (
              <>
                <div className="m-mini-value">
                  {activeSub.planName || "Pass activ"}
                </div>
                <div className="m-mini-meta">
                  {activeSub.status.toUpperCase()}
                  {activeSub.currentPeriodEnd &&
                    ` · până la ${activeSub.currentPeriodEnd.toLocaleDateString("ro-RO")}`}
                </div>
                <div className="m-mini-meta">
                  {credits.total > 0
                    ? `${credits.total} ${credits.total === 1 ? "clasă rămasă" : "clase rămase"}`
                    : "Nicio clasă cumpărată."}
                </div>
                <ManageSubscription />
              </>
            ) : (
              <>
                <div className="m-mini-value">Fără Pass activ</div>
                <a className="m-mini-link" href="/#pricing">
                  Vezi Pass-ul →
                </a>
              </>
            )}
          </div>

          <div className="m-mini-card">
            <div className="m-mini-label">Plăți recente</div>
            {recentPayments.length === 0 ? (
              <div className="m-mini-meta">Încă nicio plată.</div>
            ) : (
              <ul className="m-mini-list">
                {recentPayments.map((p) => (
                  <li key={p.id} className="m-mini-row">
                    <span>{p.planName || p.mode}</span>
                    <span className="m-mini-amount">
                      {(p.amount / 100).toFixed(2)} {p.currency.toUpperCase()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {/* ── Sesiuni viitoare ─────────────────────────────────────────── */}
      <section className="m-card-section" id="sessions">
        <div className="m-section-eyebrow">URMĂTOARELE SESIUNI</div>
        {upcoming.length === 0 ? (
          <div className="m-mini-meta">Nicio sesiune în următoarele 7 zile.</div>
        ) : (
          <ul className="m-upcoming-list">
            {upcoming.map((u) => (
              <li key={`${u.date}-${u.slot.id}`} className="m-upcoming-row">
                <div className="m-upcoming-main">
                  <div className="m-upcoming-title">{u.slot.activity.ro}</div>
                  <div className="m-upcoming-meta">
                    {u.dayLabel} · {u.date.slice(5).replace("-", ".")} · {u.slot.time}
                  </div>
                </div>
                <span className="m-upcoming-world">{u.slot.world.ro}</span>
              </li>
            ))}
          </ul>
        )}
        <a className="m-mini-link" href="/#prog">
          Programul complet →
        </a>
      </section>

      {/* ── Tab bar ──────────────────────────────────────────────────── */}
      <nav className="m-tabbar">
        <a href="#xp" className="m-tab m-tab-active">
          <span className="m-tab-icon">⚡</span>
          <span className="m-tab-label">HOME</span>
        </a>
        <a href="#board" className="m-tab">
          <span className="m-tab-icon">🏆</span>
          <span className="m-tab-label">BOARD</span>
        </a>
        <a href="#quests" className="m-tab">
          <span className="m-tab-icon">🎯</span>
          <span className="m-tab-label">QUESTS</span>
        </a>
        <a href="#card" className="m-tab">
          <span className="m-tab-icon">📡</span>
          <span className="m-tab-label">CHECK IN</span>
        </a>
      </nav>
    </>
  );
}
