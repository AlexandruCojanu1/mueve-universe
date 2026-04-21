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
        className="dash-link"
        style={{
          background: "none",
          border: "none",
          padding: 0,
          cursor: busy ? "not-allowed" : "pointer",
          opacity: busy ? 0.5 : 1,
        }}
      >
        {busy ? "..." : "Gestionează abonamentul →"}
      </button>
      {err && (
        <div
          style={{
            fontSize: "0.72rem",
            color: "#fca5a5",
            marginTop: "0.5rem",
          }}
        >
          {err}
        </div>
      )}
    </div>
  );
}
