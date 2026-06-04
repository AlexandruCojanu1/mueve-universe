"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Props = {
  connected: boolean;
  athleteName: string | null;
  lastSync: string | null; // ISO
};

const NICE = new Intl.DateTimeFormat("ro-RO", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export default function StravaCard({ connected, athleteName, lastSync }: Props) {
  const router = useRouter();
  const sp = useSearchParams();
  const flash = sp.get("strava");
  const [busy, setBusy] = useState<null | "sync" | "disconnect">(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!flash) return;
    if (flash === "connected") setMsg("Strava conectat. Am sincronizat activitățile recente.");
    else if (flash === "cancelled") setMsg("Conectarea a fost anulată.");
    else if (flash === "state") setMsg("Sesiune OAuth invalidă. Încearcă din nou.");
    else if (flash === "oauth_failed") setMsg("Strava a refuzat tokenul. Încearcă din nou.");
    else if (flash === "no_athlete") setMsg("Strava nu ne-a returnat athlete-ul.");
    else if (flash === "soon") setMsg("Integrarea Strava vine în curând.");
    else if (flash === "disabled")
      setMsg("Strava nu e configurat pe server (lipsesc cheile API). Contactează adminul.");
  }, [flash]);

  async function sync() {
    setBusy("sync");
    setMsg(null);
    try {
      const res = await fetch("/api/strava/sync", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(data.error || "Sync eșuat.");
      } else {
        setMsg(
          `Import: ${data.imported} activitate(s) noi · +${data.xpAwarded} XP · ${data.skipped} deja existente.`,
        );
        router.refresh();
      }
    } finally {
      setBusy(null);
    }
  }

  async function disconnect() {
    if (!confirm("Deconectezi Strava? Istoricul XP rămâne dar nu mai sincronizăm.")) return;
    setBusy("disconnect");
    setMsg(null);
    try {
      const res = await fetch("/api/strava/disconnect", { method: "POST" });
      if (res.ok) {
        setMsg("Strava deconectat.");
        router.refresh();
      }
    } finally {
      setBusy(null);
    }
  }

  if (!connected) {
    return (
      <div className="strava-card">
        <div className="strava-card-head">
          <div className="strava-card-eyebrow">Sincronizează-ți alergările</div>
        </div>
        <p className="strava-card-body">
          Conectează-ți contul Strava și primești XP pentru fiecare alergare, mers sau drumeție.
          Lucrăm la integrare.
        </p>
        <span className="strava-soon-badge">În curând</span>
        {msg && <div className="strava-msg">{msg}</div>}
      </div>
    );
  }

  return (
    <div className="strava-card strava-card-connected">
      <div className="strava-card-head">
        <div className="strava-card-eyebrow">
          Conectat ca {athleteName || "athlete"}
        </div>
      </div>
      <div className="strava-meta">
        {lastSync
          ? `Ultima sincronizare: ${NICE.format(new Date(lastSync))}`
          : "Niciun sync încă."}
      </div>
      <div className="strava-actions">
        <button
          className="strava-btn"
          onClick={sync}
          disabled={busy !== null}
          type="button"
        >
          {busy === "sync" ? "Sincronizez…" : "Sincronizează acum"}
        </button>
        <button
          className="strava-link"
          onClick={disconnect}
          disabled={busy !== null}
          type="button"
        >
          {busy === "disconnect" ? "…" : "Deconectează"}
        </button>
      </div>
      {msg && <div className="strava-msg">{msg}</div>}
      <a
        className="strava-pwrd"
        href="https://www.strava.com"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Powered by Strava"
      >
        {/* Official attribution logo shown next to imported Strava data. */}
        <img src="/strava/powered_by_strava_white.svg" alt="Powered by Strava" />
      </a>
    </div>
  );
}
