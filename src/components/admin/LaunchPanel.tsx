"use client";
import { useEffect, useState } from "react";

type LaunchState = { state: "pre" | "countdown" | "live"; startAt?: string };
type Winner = { name: string | null; email: string } | null;
type Raffle = { girl: Winner; boy: Winner; drawnAt: string } | null;

const STATE_LABEL: Record<LaunchState["state"], string> = {
  pre: "ECRAN DE PRE-LANSARE (site ascuns)",
  countdown: "NUMĂRĂTOARE PORNITĂ",
  live: "SITE LIVE (normal)",
};

export default function LaunchPanel() {
  const [launch, setLaunch] = useState<LaunchState | null>(null);
  const [raffle, setRaffle] = useState<Raffle>(null);
  const [eligible, setEligible] = useState<{ girls: number; boys: number; total: number } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [showStage, setShowStage] = useState(false);

  async function refresh() {
    try {
      const [l, rr] = await Promise.all([
        fetch("/api/launch", { cache: "no-store" }).then((r) => r.json()),
        fetch("/api/admin/raffle", { cache: "no-store" }).then((r) => r.json()),
      ]);
      setLaunch(l);
      setRaffle(rr.raffle ?? null);
      setEligible(rr.eligible ?? null);
    } catch {
      setErr("Nu pot citi starea.");
    }
  }

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 5000);
    return () => clearInterval(id);
  }, []);

  async function act(action: "arm" | "launch" | "reset", confirmMsg?: string) {
    if (confirmMsg && !confirm(confirmMsg)) return;
    setBusy(action);
    setErr(null);
    try {
      const res = await fetch("/api/admin/launch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setErr(data.error || "Eroare");
      await refresh();
    } finally {
      setBusy(null);
    }
  }

  async function draw() {
    if (!confirm("Extragi câștigătorii? Rezultatul înlocuiește extragerea anterioară.")) return;
    setBusy("draw");
    setErr(null);
    try {
      const res = await fetch("/api/admin/raffle", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(data.error || "Eroare la extragere.");
        return;
      }
      setRaffle(data.raffle);
      setShowStage(true);
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <div className="dash-card" style={{ marginBottom: "1.5rem" }}>
        <div className="dash-card-head">
          <div>
            <div className="dash-card-eyebrow">Pasul 1 · Lansarea</div>
            <div className="dash-card-title">
              {launch ? STATE_LABEL[launch.state] : "…"}
            </div>
          </div>
        </div>
        <p style={{ fontSize: 13, opacity: 0.7, lineHeight: 1.6 }}>
          1. <strong>Armează</strong> — vizitatorii văd doar logo-ul mueve (site-ul e ascuns).
          <br />
          2. <strong>LAUNCH</strong> — pe toate ecranele deschise pornește 10 → 1, apare MUEVE
          mare și se dezvăluie site-ul.
          <br />
          3. <strong>Reset</strong> — întoarce site-ul la normal (folosește și dacă ai armat din greșeală).
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: "0.8rem" }}>
          <button
            className="dash-btn dash-btn-light"
            disabled={busy !== null || launch?.state === "pre"}
            onClick={() => act("arm", "Pui site-ul public pe ecranul de pre-lansare?")}
          >
            {busy === "arm" ? "…" : "1 · Armează pre-lansarea"}
          </button>
          <button
            className="dash-btn dash-btn-primary"
            style={{ fontSize: "0.9rem", padding: "0.9rem 2.2rem" }}
            disabled={busy !== null || launch?.state !== "pre"}
            onClick={() => act("launch", "PORNEȘTI numărătoarea inversă pe site? 10… 9… 8…")}
          >
            {busy === "launch" ? "…" : "🚀 LAUNCH"}
          </button>
          <button
            className="dash-btn dash-btn-light"
            disabled={busy !== null || launch?.state === "live"}
            onClick={() => act("reset")}
          >
            {busy === "reset" ? "…" : "Reset (site normal)"}
          </button>
        </div>
        {launch?.state === "pre" && (
          <p style={{ fontSize: 12, marginTop: "0.8rem", color: "var(--sun)" }}>
            Site-ul public e acum ascuns. Deschide www.mueve.ro pe ecranul mare și apasă
            LAUNCH când e momentul.
          </p>
        )}
      </div>

      <div className="dash-card">
        <div className="dash-card-head">
          <div>
            <div className="dash-card-eyebrow">Pasul 2 · Tombola</div>
            <div className="dash-card-title">Extragerea câștigătorilor</div>
          </div>
        </div>
        <p style={{ fontSize: 13, opacity: 0.7, lineHeight: 1.6 }}>
          Alege aleatoriu o fată și un băiat dintre membrii înscriși (pe baza genului
          declarat la crearea contului).
          {eligible && (
            <>
              {" "}
              Eligibili acum: <strong>{eligible.girls} fete</strong> ·{" "}
              <strong>{eligible.boys} băieți</strong> (din {eligible.total} membri).
            </>
          )}
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: "0.8rem" }}>
          <button
            className="dash-btn dash-btn-primary"
            disabled={busy !== null}
            onClick={draw}
          >
            {busy === "draw" ? "Se extrage…" : "🎉 Extrage câștigătorii"}
          </button>
          {raffle && (
            <button className="dash-btn dash-btn-light" onClick={() => setShowStage(true)}>
              Afișează din nou
            </button>
          )}
        </div>
        {raffle && (
          <p style={{ fontSize: 12, opacity: 0.6, marginTop: "0.8rem" }}>
            Ultima extragere: {new Date(raffle.drawnAt).toLocaleString("ro-RO")} · Fata:{" "}
            {raffle.girl ? `${raffle.girl.name || "—"} (${raffle.girl.email})` : "—"} · Băiatul:{" "}
            {raffle.boy ? `${raffle.boy.name || "—"} (${raffle.boy.email})` : "—"}
          </p>
        )}
        {err && (
          <p style={{ fontSize: 13, color: "#ff8080", marginTop: "0.8rem" }}>{err}</p>
        )}
      </div>

      {showStage && raffle && (
        <div className="raffle-stage" onClick={() => setShowStage(false)}>
          <button className="raffle-close" aria-label="Închide">
            ×
          </button>
          <div className="raffle-title">Câștigătorii MUEVE</div>
          <div className="raffle-winners">
            <div className="raffle-card">
              <div className="raffle-kind">Fata</div>
              <div className="raffle-name">{raffle.girl?.name || raffle.girl?.email || "—"}</div>
            </div>
            <div className="raffle-card">
              <div className="raffle-kind">Băiatul</div>
              <div className="raffle-name">{raffle.boy?.name || raffle.boy?.email || "—"}</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
