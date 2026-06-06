"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type LaunchState = {
  state: "pre" | "countdown" | "live";
  startAt?: string;
  /** Content version: max(sections.updatedAt). Changes when admin edits content. */
  v?: number;
};

const COUNT_FROM = 10;
const MUEVE_MS = 2600; // how long the big MUEVE stays after the countdown
const FADE_MS = 900; // reveal fade
const POLL_FAST_MS = 1200; // while pre/countdown — tight launch sync
const POLL_SLOW_MS = 3500; // while live — picks up re-arm + content edits

/**
 * Fullscreen launch overlay + live sync. Always mounted on the landing page:
 * polls /api/launch continuously so every open phone reacts without a refresh —
 * arming shows the holding screen, LAUNCH plays 10 → 1 anchored to the server
 * startAt timestamp, reset hides it, and any admin content edit (teaser flags,
 * copy, pricing) triggers a soft router.refresh().
 */
export default function LaunchOverlay({ initial }: { initial: LaunchState }) {
  const router = useRouter();
  const [launch, setLaunch] = useState<LaunchState>(initial);
  const [now, setNow] = useState(() => Date.now());
  const [done, setDone] = useState(initial.state === "live");
  const versionRef = useRef<number | undefined>(initial.v);
  const startAtRef = useRef<string | undefined>(initial.startAt);
  const refreshedRef = useRef(false);

  const active = !done && launch.state !== "live";

  // Continuous poll — fast while an event is in progress, slow when live.
  useEffect(() => {
    let stopped = false;
    const interval = active ? POLL_FAST_MS : POLL_SLOW_MS;
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
          prev.state !== data.state || prev.startAt !== data.startAt ? data : prev,
        );
      } catch {}
    }, interval);
    return () => {
      stopped = true;
      clearInterval(id);
    };
  }, [active, router]);

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

  if (done || launch.state === "live") return null;

  if (launch.state === "pre") {
    return (
      <div className="launch-overlay">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/mueve-logo.png" alt="mueve" className="launch-logo-img" />
        <div className="launch-tag">UNIVERSUL MIȘCĂRII · SE LANSEAZĂ ACUM</div>
        <div className="launch-dot" aria-hidden />
      </div>
    );
  }

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
