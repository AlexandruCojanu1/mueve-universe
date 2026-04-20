"use client";
import { useState } from "react";

export default function ManageSubscription() {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function open() {
    setErr(null);
    setBusy(true);
    try {
      const res = await fetch("/api/customer-portal", { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setErr(data.error ?? "Nu pot deschide portalul acum.");
    } catch {
      setErr("Eroare de rețea.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        onClick={open}
        disabled={busy}
        className="text-xs uppercase tracking-widest font-bold text-[var(--sun)] hover:opacity-80 disabled:opacity-50"
      >
        {busy ? "..." : "Gestionează abonamentul →"}
      </button>
      {err && <div className="text-xs text-red-400 mt-2">{err}</div>}
    </div>
  );
}
