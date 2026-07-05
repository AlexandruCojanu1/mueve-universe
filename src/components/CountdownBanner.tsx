"use client";

import { useEffect, useState } from "react";

// Diseară, ora 20:00, ora României (EEST, +03:00).
const TARGET = new Date("2026-07-05T20:00:00+03:00").getTime();

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

export default function CountdownBanner() {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setRemaining(TARGET - Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Evită mismatch la hidratare: nu randăm cifre până nu rulează pe client.
  if (remaining === null) return null;

  const done = remaining <= 0;
  const total = Math.max(0, remaining);
  const hours = Math.floor(total / 3_600_000);
  const minutes = Math.floor((total % 3_600_000) / 60_000);
  const seconds = Math.floor((total % 60_000) / 1000);

  return (
    <div
      role="timer"
      aria-live="off"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 9998,
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.75rem",
        flexWrap: "wrap",
        padding: "0.55rem 1rem",
        background:
          "linear-gradient(90deg, var(--deep, #050816) 0%, var(--light, #11183C) 50%, var(--deep, #050816) 100%)",
        borderBottom: "1px solid var(--sun, #F5F50A)",
        color: "var(--w, #F5F5F5)",
        fontFamily: "var(--font-body, system-ui, sans-serif)",
        boxShadow: "0 2px 18px rgba(0,0,0,0.35)",
      }}
    >
      {done ? (
        <span
          style={{
            fontFamily: "var(--font-heading, system-ui, sans-serif)",
            fontWeight: 900,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            fontSize: "clamp(0.85rem, 2.5vw, 1.05rem)",
            color: "var(--sun, #F5F50A)",
          }}
        >
          🚀 Suntem live! MUEVE UNIVERSE
        </span>
      ) : (
        <>
          <span
            style={{
              fontFamily: "var(--font-heading, system-ui, sans-serif)",
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              fontSize: "clamp(0.7rem, 2vw, 0.9rem)",
              opacity: 0.9,
            }}
          >
            Se lansează diseară la 20:00
          </span>
          <span
            aria-hidden
            style={{
              display: "inline-flex",
              alignItems: "baseline",
              gap: "0.4rem",
              fontFamily: "var(--font-heading, system-ui, sans-serif)",
              fontWeight: 900,
              fontSize: "clamp(1rem, 3.2vw, 1.4rem)",
              color: "var(--sun, #F5F50A)",
              fontVariantNumeric: "tabular-nums",
              letterSpacing: "0.02em",
            }}
          >
            <span>{pad(hours)}</span>
            <span style={{ opacity: 0.55 }}>:</span>
            <span>{pad(minutes)}</span>
            <span style={{ opacity: 0.55 }}>:</span>
            <span>{pad(seconds)}</span>
          </span>
        </>
      )}
    </div>
  );
}
