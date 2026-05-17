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
import AttendanceList from "@/components/dashboard/AttendanceList";
import ReserveBoard from "@/components/dashboard/ReserveBoard";
import { appleWalletEnabled } from "@/lib/wallet/apple";
import { googleWalletEnabled } from "@/lib/wallet/google";
import { getProgramData } from "@/lib/coach-schedule";
import { upcomingSessions } from "@/lib/user-stats";
import { getCreditBalance, getActivePassRow } from "@/lib/credits";
import { issueDynamicToken } from "@/lib/qr-dynamic";
import { readDeviceBinding } from "@/lib/device-binding";
import {
  getLeaderboard,
  getUserStats,
} from "@/lib/leaderboard";

export const dynamic = "force-dynamic";

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


      {/* The on-screen member card was removed — the Apple/Google Wallet card
          is the canonical version. Device-mismatch UX is still surfaced. */}
      {!deviceCheck.ok && deviceCheck.reason === "permanently_blocked" && (
        <section className="m-card-section">
          <div className="m-banner-err">
            Acest dispozitiv a fost blocat permanent pentru contul tău. Nu te
            mai poți loga niciodată de pe el. Contactează suport.
          </div>
        </section>
      )}
      {!deviceCheck.ok && deviceCheck.reason === "device_mismatch" && (
        <DeviceSwitchModal />
      )}

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
        <AttendanceList
          rows={attendanceHistory.map((r) => ({
            slotId: r.slotId,
            slotDate: r.slotDate,
            validatedAt: r.validatedAt.toISOString(),
            method: r.method,
          }))}
        />
      </section>

      {/* ── Tab bar ──────────────────────────────────────────────────── */}
      <nav className="m-tabbar">
        <a href="#xp" className="m-tab m-tab-active">
          <span className="m-tab-label">HOME</span>
        </a>
        <a href="#board" className="m-tab">
          <span className="m-tab-label">BOARD</span>
        </a>
      </nav>
    </>
  );
}
