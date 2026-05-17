"use client";

import { useState } from "react";

export default function DeviceSwitchModal() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirm = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/account/switch-device", { method: "POST" });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(body?.error ?? "Eroare la mutarea accesului.");
        return;
      }
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
        <div className="dsm-title">Te conectezi de pe alt telefon?</div>
        <p className="dsm-body">
          Contul tău este legat de un alt dispozitiv. Dacă continui aici,
          <strong> telefonul vechi va fi blocat permanent</strong> și nu te
          vei mai putea loga niciodată pe el cu acest cont — nici după ce
          ștergi cookie-urile.
        </p>
        <p className="dsm-body dsm-body-muted">
          Asta este o măsură anti-sharing. Dacă ești tu, continuă. Dacă nu
          ești sigur, anulează.
        </p>
        {error && <div className="dsm-error">{error}</div>}
        <div className="dsm-actions">
          <button
            type="button"
            className="dsm-cancel"
            onClick={() => window.history.back()}
            disabled={busy}
          >
            Anulează
          </button>
          <button
            type="button"
            className="dsm-confirm"
            onClick={confirm}
            disabled={busy}
          >
            {busy ? "Se mută..." : "Mută accesul aici și blochează celălalt telefon"}
          </button>
        </div>
      </div>
    </div>
  );
}
