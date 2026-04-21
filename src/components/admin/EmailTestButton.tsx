"use client";
import { useState } from "react";

export default function EmailTestButton({ defaultTo }: { defaultTo: string }) {
  const [to, setTo] = useState(defaultTo);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function send() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/email-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to }),
      });
      const data = await res.json();
      setMsg({ ok: !!data.ok, text: data.ok ? "Trimis." : data.error || "Eroare" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
      <input
        className="field-input"
        type="email"
        value={to}
        onChange={(e) => setTo(e.target.value)}
        style={{ minWidth: 240 }}
      />
      <button className="dash-btn dash-btn-light" onClick={send} disabled={busy}>
        {busy ? "Trimit…" : "Trimite test"}
      </button>
      {msg && (
        <span style={{ color: msg.ok ? "#4cea9e" : "#ff8080", fontSize: 13 }}>
          {msg.text}
        </span>
      )}
    </div>
  );
}
