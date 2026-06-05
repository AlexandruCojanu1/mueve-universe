"use client";
import { useEffect, useRef, useState } from "react";

type LaunchState = { state: "pre" | "countdown" | "live"; startAt?: string };

const COUNT_FROM = 10;
const MUEVE_MS = 2600; // how long the big MUEVE stays after the countdown
const FADE_MS = 900; // reveal fade

/**
 * Fullscreen launch overlay. While the site is in pre-launch it covers the
 * landing with a holding screen and polls /api/launch; when the admin hits
 * LAUNCH it plays 10 → 1, flashes MUEVE and reveals the page.
 */
export default function LaunchOverlay({ initial }: { initial: LaunchState }) {
  const [launch, setLaunch] = useState<LaunchState>(initial);
  const [now, setNow] = useState(() => Date.now());
  const [done, setDone] = useState(initial.state === "live");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Poll while waiting (pre) — stops once the countdown starts.
  useEffect(() => {
    if (done || launch.state !== "pre") return;
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch("/api/launch", { cache: "no-store" });
        const data = (await res.json()) as LaunchState;
        if (data.state !== "pre") setLaunch(data);
      } catch {}
    }, 2000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [launch.state, done]);

  // Tick during the countdown; stop for good once the reveal is over.
  const totalMs = COUNT_FROM * 1000 + MUEVE_MS + FADE_MS;
  useEffect(() => {
    if (done || launch.state !== "countdown") return;
    const id = setInterval(() => {
      const startAt = launch.startAt ? new Date(launch.startAt).getTime() : Date.now();
      const t = Date.now();
      setNow(t);
      if (t - startAt > totalMs) setDone(true);
    }, 100);
    return () => clearInterval(id);
  }, [launch.state, launch.startAt, done, totalMs]);

  useEffect(() => {
    if (launch.state === "live") setDone(true);
  }, [launch.state]);

  if (done) return null;

  if (launch.state === "pre") {
    return (
      <div className="launch-overlay">
        <div className="launch-logo">mueve</div>
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
        <div className="launch-logo">mueve</div>
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
        <div className="launch-mueve">MUEVE</div>
      </div>
    );
  }

  return <div className="launch-overlay launch-overlay-out" aria-hidden />;
}
