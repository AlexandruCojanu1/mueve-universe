"use client";
import { useState } from "react";

const PENDING_KEY = "mueve-pending-checkout";

export default function PricingCta({
  label,
  priceId,
  planId,
  planName,
  mode,
  fallbackHref,
  className,
}: {
  label: string;
  priceId?: string;
  planId?: string;
  planName?: string;
  mode?: "subscription" | "payment";
  fallbackHref?: string;
  className?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handle(e: React.MouseEvent<HTMLAnchorElement>) {
    if (!priceId) {
      e.preventDefault();
      try {
        sessionStorage.setItem(
          PENDING_KEY,
          JSON.stringify({ planId, planName, mode, ts: Date.now() }),
        );
      } catch {}
      window.location.href = "/login?from=/dashboard";
      return;
    }
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      sessionStorage.setItem(
        PENDING_KEY,
        JSON.stringify({ priceId, planId, planName, mode, ts: Date.now() }),
      );
    } catch {}
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId, planId, planName, mode }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        url?: string;
        redirect?: string;
        error?: string;
        needsPass?: boolean;
      };
      if (res.status === 401 || data.redirect) {
        window.location.href = "/login?from=/dashboard";
        return;
      }
      if (data.url) {
        try {
          sessionStorage.removeItem(PENDING_KEY);
        } catch {}
        window.location.href = data.url;
        return;
      }
      if (data.needsPass) {
        try {
          sessionStorage.removeItem(PENDING_KEY);
        } catch {}
        setErr("Ai nevoie de Pass — ia-l întâi");
        return;
      }
      setErr(data.error ?? "Nu pot iniția plata acum.");
    } catch {
      setErr("Eroare de rețea.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <a
      href={fallbackHref || "/login?from=/dashboard"}
      onClick={handle}
      className={className}
      aria-busy={busy}
      data-busy={busy ? "1" : undefined}
    >
      {busy ? "..." : err ?? label}
    </a>
  );
}
