"use client";
import { useState } from "react";

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
    if (!priceId) return; // no Stripe wired — let the anchor navigate to fallbackHref
    e.preventDefault();
    setErr(null);
    setBusy(true);
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
      };
      if (data.redirect) {
        window.location.href = data.redirect;
        return;
      }
      if (data.url) {
        window.location.href = data.url;
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
      href={fallbackHref || "#join"}
      onClick={handle}
      className={className}
      aria-busy={busy}
      data-busy={busy ? "1" : undefined}
    >
      {busy ? "..." : err ?? label}
    </a>
  );
}
