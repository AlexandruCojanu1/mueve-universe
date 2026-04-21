"use client";
import { useEffect, useState } from "react";

const PENDING_KEY = "mueve-pending-checkout";

type Intent = {
  priceId?: string;
  planId?: string;
  planName?: string;
  mode?: "subscription" | "payment";
  ts?: number;
};

export default function AutoCheckout() {
  const [state, setState] = useState<"idle" | "launching" | "error">("idle");
  const [planName, setPlanName] = useState<string | null>(null);

  useEffect(() => {
    let raw: string | null = null;
    try {
      raw = sessionStorage.getItem(PENDING_KEY);
    } catch {}
    if (!raw) return;

    let intent: Intent = {};
    try {
      intent = JSON.parse(raw) as Intent;
    } catch {
      try {
        sessionStorage.removeItem(PENDING_KEY);
      } catch {}
      return;
    }

    if (!intent.priceId || !intent.ts || Date.now() - intent.ts > 30 * 60 * 1000) {
      try {
        sessionStorage.removeItem(PENDING_KEY);
      } catch {}
      return;
    }

    setState("launching");
    setPlanName(intent.planName ?? null);

    (async () => {
      try {
        const res = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            priceId: intent.priceId,
            planId: intent.planId,
            planName: intent.planName,
            mode: intent.mode,
          }),
        });
        const data = (await res.json().catch(() => ({}))) as { url?: string };
        try {
          sessionStorage.removeItem(PENDING_KEY);
        } catch {}
        if (data.url) {
          window.location.href = data.url;
          return;
        }
        setState("error");
      } catch {
        setState("error");
      }
    })();
  }, []);

  if (state === "idle") return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={
        "dash-banner " + (state === "error" ? "dash-banner-error" : "dash-banner-success")
      }
    >
      <div>
        <div className="dash-banner-title">
          {state === "error" ? "Plată indisponibilă" : "Te ducem la plată…"}
        </div>
        <div className="dash-banner-body">
          {state === "error"
            ? "Nu am putut iniția Stripe. Reîncearcă din secțiunea Abonamente."
            : planName
              ? `Pregătim checkout pentru ${planName}.`
              : "Pregătim checkout-ul Stripe."}
        </div>
      </div>
    </div>
  );
}
