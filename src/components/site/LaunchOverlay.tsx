"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Winners = {
  girl: { name: string | null } | null;
  boy: { name: string | null } | null;
  shownAt?: string;
} | null;

type LaunchState = {
  state: "pre" | "countdown" | "live";
  startAt?: string;
  gate?: boolean;
  winners?: Winners;
  /** Content version: max(sections.updatedAt). Changes when admin edits content. */
  v?: number;
};

const COUNT_FROM = 10;
const MUEVE_MS = 2600; // how long the big MUEVE stays after the countdown
const FADE_MS = 900; // reveal fade
const POLL_FAST_MS = 1200; // while pre/countdown/winners — tight event sync
const POLL_SLOW_MS = 3500; // while live — picks up re-arm + content edits
const GATE_KEY = "mueve-gate-entry";

/**
 * Fullscreen launch overlay + live sync. Always mounted on the landing page:
 * polls /api/launch continuously so every open phone reacts without a refresh —
 * arming shows the holding screen, LAUNCH plays 10 → 1 anchored to the server
 * startAt timestamp, the raffle draw shows the winners on every screen, the
 * gate asks visitors for name + email before the site opens, and any admin
 * content edit (teaser flags, copy, pricing) triggers a soft router.refresh().
 */
export default function LaunchOverlay({ initial }: { initial: LaunchState }) {
  const router = useRouter();
  const [launch, setLaunch] = useState<LaunchState>(initial);
  const [now, setNow] = useState(() => Date.now());
  const [done, setDone] = useState(initial.state === "live");
  const [entered, setEntered] = useState<boolean | null>(null); // null until localStorage read
  const versionRef = useRef<number | undefined>(initial.v);
  const startAtRef = useRef<string | undefined>(initial.startAt);
  const refreshedRef = useRef(false);

  // Gate membership is per-device (localStorage), read after mount (SSR-safe).
  useEffect(() => {
    try {
      setEntered(!!localStorage.getItem(GATE_KEY));
    } catch {
      setEntered(true); // storage unavailable → don't trap the visitor
    }
  }, []);

  const eventActive =
    (!done && launch.state !== "live") || !!launch.winners || (launch.gate && entered === false);

  // Continuous poll — fast while an event is in progress, slow when live.
  useEffect(() => {
    let stopped = false;
    const interval = eventActive ? POLL_FAST_MS : POLL_SLOW_MS;
    const id = setInterval(async () => {
      try {
        const res = await fetch("/api/launch", { cache: "no-store" });
        if (!res.ok || stopped) return;
        const data = (await res.json()) as LaunchState;

        // Content edited in admin → soft-refresh server components in place.
        if (
          typeof data.v === "number" &&
          versionRef.current !== undefined &&
          data.v !== versionRef.current
        ) {
          router.refresh();
        }
        if (typeof data.v === "number") versionRef.current = data.v;

        // Re-arm / new countdown after we already finished one → show again.
        if (
          data.state === "pre" ||
          (data.state === "countdown" && data.startAt !== startAtRef.current)
        ) {
          setDone(false);
          refreshedRef.current = false;
        }
        if (data.state === "countdown") startAtRef.current = data.startAt;
        if (data.state === "live") setDone(true);

        setLaunch((prev) =>
          prev.state !== data.state ||
          prev.startAt !== data.startAt ||
          prev.gate !== data.gate ||
          JSON.stringify(prev.winners ?? null) !== JSON.stringify(data.winners ?? null)
            ? data
            : prev,
        );
      } catch {}
    }, interval);
    return () => {
      stopped = true;
      clearInterval(id);
    };
  }, [eventActive, router]);

  // Tick during the countdown; reveal + refresh content once it's over.
  const totalMs = COUNT_FROM * 1000 + MUEVE_MS + FADE_MS;
  useEffect(() => {
    if (done || launch.state !== "countdown") return;
    const id = setInterval(() => {
      const startAt = launch.startAt ? new Date(launch.startAt).getTime() : Date.now();
      const t = Date.now();
      setNow(t);
      if (t - startAt > totalMs) {
        setDone(true);
        if (!refreshedRef.current) {
          refreshedRef.current = true;
          // The site behind the overlay was rendered pre-launch — pull the
          // freshest content the moment it's revealed.
          router.refresh();
        }
      }
    }, 100);
    return () => clearInterval(id);
  }, [launch.state, launch.startAt, done, totalMs, router]);

  // ── Render priority: countdown > winners > holding screen > gate ──

  if (!done && launch.state === "countdown") {
    const startAt = launch.startAt ? new Date(launch.startAt).getTime() : now;
    const elapsedMs = now - startAt;

    if (elapsedMs < 0) {
      return (
        <div className="launch-overlay">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/mueve-logo.png" alt="mueve" className="launch-logo-img" />
        </div>
      );
    }

    const number = COUNT_FROM - Math.floor(elapsedMs / 1000);
    if (number >= 1) {
      return (
        <div className="launch-overlay">
          <div key={number} className="launch-count">
            {number}
          </div>
        </div>
      );
    }

    const afterMs = elapsedMs - COUNT_FROM * 1000;
    if (afterMs < MUEVE_MS) {
      return (
        <div className="launch-overlay">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/mueve-logo.png" alt="mueve" className="launch-mueve-img" />
        </div>
      );
    }
    return <div className="launch-overlay launch-overlay-out" aria-hidden />;
  }

  if (launch.winners) {
    return (
      <div className="raffle-stage">
        <div className="raffle-title">Câștigătorii MUEVE</div>
        <div className="raffle-winners">
          <div className="raffle-card">
            <div className="raffle-kind">Fata</div>
            <div className="raffle-name">{launch.winners.girl?.name || "—"}</div>
          </div>
          <div className="raffle-card">
            <div className="raffle-kind">Băiatul</div>
            <div className="raffle-name">{launch.winners.boy?.name || "—"}</div>
          </div>
        </div>
      </div>
    );
  }

  if (!done && launch.state === "pre") {
    return (
      <div className="launch-overlay">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/mueve-logo.png" alt="mueve" className="launch-logo-img" />
        <div className="launch-tag">UNIVERSUL MIȘCĂRII · SE LANSEAZĂ ACUM</div>
        <div className="launch-dot" aria-hidden />
      </div>
    );
  }

  if (launch.gate && entered === false) {
    return <GateForm onEntered={() => setEntered(true)} />;
  }

  return null;
}

function GateForm({ onEntered }: { onEntered: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState<"f" | "m" | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setErr(null);
    if (name.trim().length < 2) return setErr("Scrie-ți numele.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim()))
      return setErr("Email invalid.");
    if (!gender) return setErr("Alege Fată sau Băiat.");
    setBusy(true);
    try {
      const res = await fetch("/api/gate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), gender }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(data.error || "Eroare. Încearcă din nou.");
        return;
      }
      try {
        localStorage.setItem(GATE_KEY, email.trim().toLowerCase());
      } catch {}
      onEntered();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="launch-overlay gate-overlay">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/mueve-logo.png" alt="mueve" className="gate-logo" />
      <form className="gate-form" onSubmit={submit}>
        <div className="gate-title">INTRĂ ÎN UNIVERS</div>
        <div className="gate-sub">Lasă-ți numele și emailul ca să deschizi site-ul și să intri în tombolă.</div>
        <input
          className="gate-input"
          type="text"
          placeholder="Numele tău"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          maxLength={80}
        />
        <input
          className="gate-input"
          type="email"
          placeholder="email@exemplu.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          maxLength={160}
        />
        <div className="gate-gender">
          <button
            type="button"
            className={"gate-gender-btn" + (gender === "f" ? " on" : "")}
            onClick={() => setGender("f")}
          >
            Fată
          </button>
          <button
            type="button"
            className={"gate-gender-btn" + (gender === "m" ? " on" : "")}
            onClick={() => setGender("m")}
          >
            Băiat
          </button>
        </div>
        {err && <div className="gate-err">{err}</div>}
        <button type="submit" className="gate-submit" disabled={busy}>
          {busy ? "..." : "DESCHIDE SITE-UL"}
        </button>
      </form>
    </div>
  );
}
