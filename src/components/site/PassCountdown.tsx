"use client";
import { useEffect, useState } from "react";
import { useLang } from "@/lib/lang-context";

// Fixed deal deadline: Sunday 2026-06-28 20:00 Europe/Bucharest (EEST, UTC+3).
const DEADLINE = Date.parse("2026-06-28T17:00:00Z");

export default function PassCountdown() {
  const { lang } = useLang();
  // null until mounted so SSR and first client render match (no hydration mismatch)
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (now === null) return null;
  const remaining = DEADLINE - now;
  if (remaining <= 0) return null;

  const sec = Math.floor(remaining / 1000);
  const days = Math.floor(sec / 86400);
  const hours = Math.floor((sec % 86400) / 3600);
  const mins = Math.floor((sec % 3600) / 60);
  const secs = sec % 60;

  const text =
    lang === "ro"
      ? `${days} ZILE ${hours} ORE ${mins} MIN ${secs} SEC`
      : `${days} DAYS ${hours} HRS ${mins} MIN ${secs} SEC`;

  const label =
    lang === "ro" ? "OFERTĂ VALABILĂ PÂNĂ DUMINICĂ 20:00" : "OFFER ENDS SUNDAY 20:00";

  return (
    <div className="pass-countdown">
      <span className="pass-countdown-label">{label}</span>
      <span className="pass-countdown-clock">{text}</span>
    </div>
  );
}
