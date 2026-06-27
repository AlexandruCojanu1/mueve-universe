"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { LAUNCH_AT } from "@/lib/launch-window";

/**
 * Full-screen holding page shown to every visitor until LAUNCH_AT
 * (Sunday 20:00 Bucharest). The decision to render it is made server-side in
 * page.tsx, so the real site is never sent to the browser before launch — no
 * flash of content. This component only runs the ticking clock and reloads the
 * page the moment the countdown hits zero so the site reveals itself.
 */
export default function ComingSoon() {
  // null until mounted so SSR and first client render match (no hydration mismatch)
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const remaining = now === null ? LAUNCH_AT - Date.now() : LAUNCH_AT - now;

  // Reveal the site the instant we cross the deadline.
  useEffect(() => {
    if (now !== null && remaining <= 0) window.location.reload();
  }, [now, remaining]);

  const sec = Math.max(0, Math.floor(remaining / 1000));
  const days = Math.floor(sec / 86400);
  const hours = Math.floor((sec % 86400) / 3600);
  const mins = Math.floor((sec % 3600) / 60);
  const secs = sec % 60;

  const pad = (n: number) => String(n).padStart(2, "0");

  const units = [
    { v: days, ro: "ZILE", en: "DAYS" },
    { v: hours, ro: "ORE", en: "ORE" },
    { v: mins, ro: "MIN", en: "MIN" },
    { v: secs, ro: "SEC", en: "SEC" },
  ];

  return (
    <main className="coming-soon">
      <div className="coming-soon-inner">
        <Image
          src="/mueve-logo.png"
          alt="MUEVE UNIVERSE"
          width={260}
          height={120}
          priority
          className="coming-soon-logo"
        />
        <p className="coming-soon-kicker">REVENIM DUMINICĂ · 20:00</p>
        <div className="coming-soon-clock" suppressHydrationWarning>
          {units.map((u, i) => (
            <div className="coming-soon-unit" key={i}>
              <span className="coming-soon-num">{pad(u.v)}</span>
              <span className="coming-soon-lab">{u.ro}</span>
            </div>
          ))}
        </div>
        <p className="coming-soon-tag">MIȘCĂ-TE. TRĂIEȘTE. EVOLUEAZĂ.</p>
      </div>
    </main>
  );
}
