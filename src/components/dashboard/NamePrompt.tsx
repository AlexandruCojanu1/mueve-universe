"use client";

import { useState } from "react";

export default function NamePrompt() {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    const trimmed = name.trim().replace(/\s+/g, " ");
    if (trimmed.length < 2) {
      setError("Introdu numele tău complet.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/account/name", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(body?.error ?? "Eroare la salvare. Încearcă din nou.");
        return;
      }
      // Greeting and the wallet card both read the name from the DB, so a
      // reload re-renders everything with the freshly saved name.
      window.location.reload();
    } catch {
      setError("Eroare de rețea. Încearcă din nou.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="dsm-backdrop" role="dialog" aria-modal="true">
      <div className="dsm-card">
        <div className="dsm-title">Cum te cheamă?</div>
        <p className="dsm-body">
          Spune-ne numele tău ca să-ți personalizăm cardul de membru și salutul.
          Nu îl avem fiindcă ți-ai ascuns emailul la conectarea cu Apple.
        </p>
        <input
          className="dsm-input"
          type="text"
          autoFocus
          placeholder="Numele tău"
          value={name}
          maxLength={60}
          autoComplete="name"
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !busy) save();
          }}
        />
        {error && <div className="dsm-error">{error}</div>}
        <div className="dsm-actions">
          <button
            type="button"
            className="dsm-confirm"
            onClick={save}
            disabled={busy}
          >
            {busy ? "Se salvează..." : "Salvează"}
          </button>
        </div>
      </div>
    </div>
  );
}
