import { auth } from "@/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { subscriptions, payments, users, attendances } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import CheckoutBanner from "@/components/dashboard/CheckoutBanner";
import AutoCheckout from "@/components/dashboard/AutoCheckout";
import WalletButtons from "@/components/dashboard/WalletButtons";
import AutoRotateQr from "@/components/dashboard/AutoRotateQr";
import StravaCard from "@/components/dashboard/StravaCard";
import ManageSubscription from "@/components/dashboard/ManageSubscription";
import AvatarMenu from "@/components/dashboard/AvatarMenu";
import DeviceSwitchModal from "@/components/dashboard/DeviceSwitchModal";
import ReserveBoard from "@/components/dashboard/ReserveBoard";
import { appleWalletEnabled } from "@/lib/wallet/apple";
import { googleWalletEnabled } from "@/lib/wallet/google";
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
  const memberSince = userRow?.createdAt
    ? userRow.createdAt
        .toLocaleDateString("ro-RO", { month: "short", year: "numeric" })
        .toUpperCase()
    : null;

  return (
    <>
      <AutoCheckout />
      <CheckoutBanner status={sp.checkout} />

      {/* ── Hello ─────────────────────────────────────────────────────── */}
      <header className="m-hello">
        <div>
          <div className="m-hello-eyebrow">{today} CREW</div>
          <h1 className="m-hello-name">Hey, {firstName}</h1>
        </div>
        <AvatarMenu initials={initialsStr} />
      </header>

      {/* ── Hero XP card ─────────────────────────────────────────────── */}
      {xpStats && (
        <section className="m-hero-xp" id="xp">
          <div className="m-hero-xp-row">
            <div className="m-hero-xp-tier">
              LVL {xpStats.tier.level} · {xpStats.tier.name.toUpperCase()}
            </div>
            <div className="m-streak-badge">
              <span className="m-streak-num">{xpStats.currentStreak}</span>
              <span className="m-streak-unit">WKS STREAK</span>
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

      {/* ── Stat tiles ───────────────────────────────────────────────── */}
      {xpStats && (
        <section className="m-stats">
          <div className="m-stat-tile">
            <div className="m-stat-value">{xpStats.runs}</div>
            <div className="m-stat-label">Runs</div>
          </div>
          <div className="m-stat-tile">
            <div className="m-stat-value">{xpStats.currentStreak}wk</div>
            <div className="m-stat-label">Streak</div>
          </div>
          <div className="m-stat-tile">
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

      {/* ── Member card — awwwards-grade ─────────────────────────────── */}
      <section className="m-card-section" id="card">
        <div className="m-section-eyebrow">CARDUL TĂU</div>
        {!deviceCheck.ok && deviceCheck.reason === "permanently_blocked" && (
          <div className="m-banner-err">
            Acest dispozitiv a fost blocat permanent pentru contul tău. Nu te
            mai poți loga niciodată de pe el. Contactează suport.
          </div>
        )}
        {!deviceCheck.ok && deviceCheck.reason === "device_mismatch" && (
          <DeviceSwitchModal />
        )}
        <div className="mc-card">
          <div className="mc-rays" aria-hidden />
          <div className="mc-grain" aria-hidden />

          <div className="mc-top">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/mueve-logo.png" alt="MUEVE" className="mc-logo" />
            <div className="mc-tier-block">
              <div className="mc-tier">{xpStats?.tier.name ?? "Member"}</div>
              <div className="mc-meta">LVL {xpStats?.tier.level ?? 1}</div>
            </div>
          </div>

          <div className="mc-streak-strip">
            <div className="mc-streak-big">
              <span className="mc-streak-num">{xpStats?.currentStreak ?? 0}</span>
              <span className="mc-streak-week">W</span>
            </div>
            <div className="mc-streak-side">
              <div className="mc-streak-label">CONSECVENȚĂ</div>
              <div className="mc-streak-sub">
                {xpStats?.currentStreak
                  ? `${xpStats.currentStreak} săptămâni la rând`
                  : "Începe streak-ul săptămâna asta"}
              </div>
            </div>
          </div>

          <div className="mc-qr-frame">
            <AutoRotateQr
              origin={origin}
              initialToken={initialQr.token}
              initialExpiresAt={initialQr.expiresAt}
            />
          </div>

          <div className="mc-divider" />

          <div className="mc-foot">
            <div className="mc-name">
              {session?.user?.name || session?.user?.email?.split("@")[0] || "Membru"}
            </div>
            <div className="mc-stats">
              <div className="mc-stat">
                <div className="mc-stat-num">{credits.total}</div>
                <div className="mc-stat-key">CLASE</div>
              </div>
              <div className="mc-stat">
                <div className="mc-stat-num">{xpStats?.runs ?? 0}</div>
                <div className="mc-stat-key">SESIUNI</div>
              </div>
              <div className="mc-stat">
                <div className="mc-stat-num">
                  {xpStats?.xp ? xpStats.xp.toLocaleString("ro-RO") : 0}
                </div>
                <div className="mc-stat-key">XP</div>
              </div>
            </div>
            <div className="mc-status-row">
              <span className={pass ? "mc-status mc-status-ok" : "mc-status mc-status-bad"}>
                {pass ? "● PASS ACTIV" : "○ FĂRĂ PASS"}
              </span>
              {memberSince && (
                <span className="mc-since">EST. {memberSince}</span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Strava tile (compact CTA) — placed directly under the QR card ── */}
      <section className="m-actions m-actions-single">
        <a
          href={stravaConnected ? "#strava" : "/api/strava/connect"}
          className="m-action m-action-orange"
        >
          <div className="m-action-label">
            {stravaConnected ? "Log Strava Run" : "Connect Strava"}
          </div>
          <div className="m-action-meta">
            {stravaConnected ? "+10 XP / km · sync" : "+10 XP / km · auto"}
          </div>
        </a>
      </section>

      {/* ── Wallet ─ shown only when at least one provider is wired up ── */}
      {(appleWalletEnabled() || googleWalletEnabled()) && (
        <section className="m-card-section" id="wallet">
          <div className="m-section-eyebrow">WALLET DIGITAL</div>
          <WalletButtons
            appleEnabled={appleWalletEnabled()}
            googleEnabled={googleWalletEnabled()}
          />
        </section>
      )}

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

      {/* ── Rezervă sesiuni ──────────────────────────────────────────── */}
      <section className="m-card-section" id="sessions">
        <div className="m-section-eyebrow">REZERVĂ SESIUNI</div>
        <p className="m-section-sub">
          Rezervă-ți loc la sesiuni — se consumă o clasă. Dacă anulezi cu peste
          2h înainte, clasa se întoarce.
        </p>
        <ReserveBoard />
      </section>

      {upcoming.length > 0 && (
        <section className="m-card-section">
          <div className="m-section-eyebrow">PROGRAM SĂPTĂMÂNAL</div>
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
          <a className="m-mini-link" href="/#prog">
            Programul complet →
          </a>
        </section>
      )}

      {/* ── Istoric prezențe ─────────────────────────────────────────── */}
      <section className="m-card-section" id="history">
        <div className="m-section-eyebrow">ISTORIC PREZENȚE</div>
        {attendanceHistory.length === 0 ? (
          <div className="m-mini-meta">
            Încă nu ai fost marcat la nicio sesiune. Arată cardul tău QR
            coach-ului la intrarea în sesiune.
          </div>
        ) : (
          <ul className="m-upcoming-list">
            {attendanceHistory.slice(0, 10).map((r) => (
              <li
                key={`${r.slotId}-${r.slotDate}`}
                className="m-upcoming-row"
              >
                <div className="m-upcoming-main">
                  <div className="m-upcoming-title">{r.slotDate}</div>
                  <div className="m-upcoming-meta">
                    {r.validatedAt.toLocaleString("ro-RO")}
                  </div>
                </div>
                <span className="m-upcoming-world">{r.method}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ── Tab bar ──────────────────────────────────────────────────── */}
      <nav className="m-tabbar">
        <a href="#xp" className="m-tab m-tab-active">
          <span className="m-tab-label">HOME</span>
        </a>
        <a href="#board" className="m-tab">
          <span className="m-tab-label">BOARD</span>
        </a>
        <a href="#quests" className="m-tab">
          <span className="m-tab-label">QUESTS</span>
        </a>
        <a href="#card" className="m-tab">
          <span className="m-tab-label">CHECK IN</span>
        </a>
      </nav>
    </>
  );
}
