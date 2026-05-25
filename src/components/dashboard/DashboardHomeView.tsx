import type { CSSProperties } from "react";
import CheckoutBanner from "@/components/dashboard/CheckoutBanner";
import AutoCheckout from "@/components/dashboard/AutoCheckout";
import AvatarMenu from "@/components/dashboard/AvatarMenu";
import DeviceSwitchModal from "@/components/dashboard/DeviceSwitchModal";
import NamePrompt from "@/components/dashboard/NamePrompt";
import DashboardTabBar from "@/components/dashboard/DashboardTabBar";

type WorldColor = "yellow" | "purple" | "blue" | "orange";

export type DashboardHomeData = {
  today: string;
  firstName: string;
  initials: string;
  needsName: boolean;
  checkoutStatus?: string;
  deviceBlocked: boolean;
  deviceMismatch: boolean;

  nextSession: {
    dayWord: string;
    time: string;
    activity: string;
    world: string;
    color: WorldColor;
    spotsLabel: string | null;
  } | null;

  streakWeeks: number;
  week: { letters: string[]; attended: boolean[]; count: number };
  crew: { initials: string; name: string }[];

  stats: { runs: number; xp: number; streakWeeks: number; rank: number | null };
  progress: {
    tierName: string;
    nextTierName: string | null;
    xpToGo: number;
    pct: number;
  } | null;
};

export default function DashboardHomeView({ data }: { data: DashboardHomeData }) {
  const d = data;
  const ring = Math.round((d.week.count / 7) * 100);

  return (
    <>
      <AutoCheckout />
      {d.needsName && <NamePrompt />}
      <CheckoutBanner status={d.checkoutStatus} />

      {/* ── Hello ─────────────────────────────────────────────────────── */}
      <header className="m-hello">
        <div>
          <div className="m-hello-eyebrow">{d.today} CREW</div>
          <h1 className="m-hello-name">Salut, {d.firstName}</h1>
        </div>
        <AvatarMenu initials={d.initials} />
      </header>

      {/* ── Next session — the actionable hero ────────────────────────── */}
      {d.nextSession ? (
        <section className="m-next" data-c={d.nextSession.color}>
          <div className="m-next-glow" aria-hidden />
          <div className="m-next-top">
            <span className="m-next-eyebrow">URMĂTOAREA SESIUNE</span>
            {d.streakWeeks > 0 && (
              <span className="m-streak-pill">🔥 {d.streakWeeks} săpt streak</span>
            )}
          </div>
          <div className="m-next-when">
            <span className="m-next-day">{d.nextSession.dayWord}</span>
            <span className="m-next-time">{d.nextSession.time}</span>
          </div>
          <div className="m-next-act">
            {d.nextSession.activity} · {d.nextSession.world}
          </div>
          <div className="m-next-meta">
            <span className="m-pill">🕐 {d.nextSession.time}</span>
            <span className="m-pill m-pill-world">
              <span className="m-pill-dot" />
              {d.nextSession.world}
            </span>
            {d.nextSession.spotsLabel && (
              <span className="m-pill">👤 {d.nextSession.spotsLabel}</span>
            )}
          </div>
          {d.crew.length > 0 && (
            <div className="m-next-crew">
              <div className="m-ava-stack">
                {d.crew.slice(0, 4).map((c, i) => (
                  <span className="m-ava" key={i} style={{ zIndex: 10 - i }}>
                    {c.initials}
                  </span>
                ))}
              </div>
              <span className="m-next-crew-label">
                {d.crew[0].name}
                {d.crew.length > 1 ? `, ${d.crew[1].name}` : ""}
                {d.crew.length > 2 ? ` +${d.crew.length - 2}` : ""} sunt în crew
              </span>
            </div>
          )}
          <a className="m-next-cta" href="/dashboard/program">
            Rezervă-ți locul
          </a>
        </section>
      ) : (
        <section className="m-next m-next-empty">
          <div className="m-next-eyebrow">PROGRAM</div>
          <div className="m-next-act">Niciun antrenament programat momentan.</div>
          <a className="m-next-cta" href="/dashboard/program">
            Vezi programul
          </a>
        </section>
      )}

      {/* ── Weekly attendance ring ─────────────────────────────────────── */}
      <section className="m-week">
        <div
          className="m-week-ring"
          style={{ "--ring": `${ring}%` } as CSSProperties}
        >
          <span className="m-week-flame">🔥</span>
        </div>
        <div className="m-week-body">
          <div className="m-week-title">
            Prezență săptămânală · <strong>{d.week.count} din 7</strong>
          </div>
          <div className="m-week-days">
            {d.week.letters.map((letter, i) => (
              <span
                key={i}
                className={"m-week-day" + (d.week.attended[i] ? " on" : "")}
              >
                {letter}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── This month — stat tiles ───────────────────────────────────── */}
      <section className="m-month">
        <div className="m-month-head">
          <h2 className="m-month-title">Luna aceasta</h2>
          <a className="m-month-link" href="/dashboard/board">
            Vezi tot →
          </a>
        </div>
        <div className="m-stats m-stats-2">
          <div className="m-stat-tile">
            <div className="m-stat-value m-stat-accent">{d.stats.runs}</div>
            <div className="m-stat-label">Sesiuni</div>
          </div>
          <div className="m-stat-tile">
            <div className="m-stat-value">{d.stats.xp}</div>
            <div className="m-stat-label">XP total</div>
          </div>
          <div className="m-stat-tile">
            <div className="m-stat-value">
              {d.stats.streakWeeks}
              <span className="m-stat-unit">săpt</span>
            </div>
            <div className="m-stat-label">Streak</div>
          </div>
          <div className="m-stat-tile">
            <div className="m-stat-value m-stat-rank">
              {d.stats.rank ? `#${d.stats.rank}` : "—"}
            </div>
            <div className="m-stat-label">Rank comunitate</div>
          </div>
        </div>
      </section>

      {/* ── Progress note (coach-note style) ──────────────────────────── */}
      {d.progress && (
        <section className="m-note">
          <div className="m-note-icon">🎯</div>
          <div className="m-note-body">
            <div className="m-note-eyebrow">PROGRESUL TĂU</div>
            <p className="m-note-text">
              Ești <strong>{d.progress.tierName}</strong>.{" "}
              {d.progress.nextTierName
                ? `Încă ${d.progress.xpToGo} XP până la ${d.progress.nextTierName} — apropie-te cu fiecare sesiune.`
                : "Ai atins nivelul maxim. Legendă."}
            </p>
            {d.progress.nextTierName && (
              <div className="m-note-bar">
                <div
                  className="m-note-bar-fill"
                  style={{ width: `${d.progress.pct}%` }}
                />
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Device safety surfaces ────────────────────────────────────── */}
      {d.deviceBlocked && (
        <section className="m-card-section">
          <div className="m-banner-err">
            Acest dispozitiv a fost blocat permanent pentru contul tău. Nu te
            mai poți loga niciodată de pe el. Contactează suport.
          </div>
        </section>
      )}
      {d.deviceMismatch && <DeviceSwitchModal />}

      <DashboardTabBar active="home" />
    </>
  );
}
