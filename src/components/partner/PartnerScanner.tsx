"use client";
import { useEffect, useRef, useState } from "react";

type Result = {
  valid: boolean;
  member?: { name: string | null; email: string } | null;
  pass?: { planName: string | null; periodEnd: string | null } | null;
  discount?: { percent: number; description: string; company: string };
  reason?: string | null;
};

export default function PartnerScanner() {
  const containerRef = useRef<HTMLDivElement>(null);
  const scannerRef = useRef<unknown>(null);
  const cooldown = useRef(0);
  const [running, setRunning] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [last, setLast] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);

  async function verify(raw: string) {
    const now = Date.now();
    if (now - cooldown.current < 2500) return;
    cooldown.current = now;
    setBusy(true);
    try {
      const res = await fetch("/api/partner/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: raw }),
      });
      const data = (await res.json().catch(() => ({}))) as Result & { error?: string };
      setLast(data);
    } catch {
      setLast({ valid: false, reason: "Eroare de rețea." });
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    async function start() {
      try {
        const mod = await import("html5-qrcode");
        const { Html5Qrcode } = mod;
        const el = containerRef.current;
        if (!el || cancelled) return;
        el.innerHTML = "";
        const id = "qr-partner-" + Math.random().toString(36).slice(2, 8);
        const host = document.createElement("div");
        host.id = id;
        el.appendChild(host);
        const scanner = new Html5Qrcode(id, { verbose: false });
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 260, height: 260 } },
          (decoded) => verify(decoded),
          () => {},
        );
        if (cancelled) {
          try {
            await scanner.stop();
          } catch {}
          return;
        }
        setRunning(true);
      } catch (e) {
        setErr(
          e instanceof Error ? e.message : "Nu pot deschide camera. Verifică permisiunile browserului.",
        );
      }
    }
    start();
    return () => {
      cancelled = true;
      const s = scannerRef.current as { stop?: () => Promise<void> } | null;
      if (s?.stop) s.stop().catch(() => {});
    };
  }, []);

  return (
    <div className="dash-grid-2">
      <div>
        <div className="dash-card-eyebrow" style={{ marginBottom: ".5rem" }}>
          Cameră
        </div>
        <div
          style={{
            position: "relative",
            aspectRatio: "1/1",
            background: "#000",
            borderRadius: 16,
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,.1)",
          }}
        >
          <div ref={containerRef} style={{ position: "absolute", inset: 0 }} />
          {!running && !err && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: 0.6,
                fontSize: ".85rem",
              }}
            >
              Pornesc camera…
            </div>
          )}
          {err && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "1rem",
                textAlign: "center",
                color: "#ff8080",
                fontSize: ".85rem",
              }}
            >
              {err}
            </div>
          )}
        </div>
      </div>

      <div>
        <div className="dash-card-eyebrow" style={{ marginBottom: ".5rem" }}>
          Rezultat
        </div>
        {!last && (
          <div className="dash-empty">
            {busy ? "Verific…" : "Scanează un QR pentru validare."}
          </div>
        )}
        {last && last.valid && (
          <div className="q-card q-card-ok" style={{ padding: "1.5rem" }}>
            <div className="q-card-badge">✓ Valid</div>
            <div className="q-card-title">
              {last.member?.name || last.member?.email}
            </div>
            {last.member?.email && (
              <div className="q-card-sub">{last.member.email}</div>
            )}
            <div className="q-discount">
              <div className="q-discount-label">Aplică</div>
              <div className="q-discount-val">-{last.discount?.percent}%</div>
              {last.discount?.description && (
                <div className="q-discount-desc">
                  {last.discount.description}
                </div>
              )}
            </div>
          </div>
        )}
        {last && !last.valid && (
          <div className="q-card q-card-error" style={{ padding: "1.5rem" }}>
            <div className="q-card-badge q-card-badge-err">✕ Refuzat</div>
            <div className="q-card-title">
              {last.member?.name || last.member?.email || "Necunoscut"}
            </div>
            <div className="q-card-body">{last.reason || "QR invalid."}</div>
          </div>
        )}
      </div>
    </div>
  );
}
