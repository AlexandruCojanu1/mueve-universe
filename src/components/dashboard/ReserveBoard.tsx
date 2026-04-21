"use client";
import { useEffect, useState } from "react";

type Slot = {
  slotId: string;
  slotDate: string;
  dayOfWeek: number;
  startTime: string;
  durationMin: number;
  classType: string;
  capacity: number;
  taken: number;
  reserved: boolean;
};

const DAYS = ["Luni", "Marți", "Miercuri", "Joi", "Vineri", "Sâmbătă", "Duminică"];

function fmtDate(s: string): string {
  const d = new Date(s + "T00:00:00");
  return d.toLocaleDateString("ro-RO", {
    day: "2-digit",
    month: "short",
  });
}

export default function ReserveBoard() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/slots/available");
      const data = await res.json();
      setSlots(data.slots || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function reserve(s: Slot) {
    setErr(null);
    setBusy(`${s.slotId}|${s.slotDate}`);
    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slotId: s.slotId, slotDate: s.slotDate }),
      });
      const data = await res.json();
      if (!res.ok) setErr(data.error || "Eroare");
      await load();
    } finally {
      setBusy(null);
    }
  }

  async function cancel(s: Slot) {
    const d = new Date(s.slotDate + "T00:00:00");
    const twoH = new Date(d.getTime() - 2 * 3600_000);
    const late = new Date() > twoH;
    const msg = late
      ? "Anulezi sub 2h înainte — creditul NU se returnează."
      : "Anulezi rezervarea? Creditul se întoarce.";
    if (!confirm(msg)) return;
    setBusy(`${s.slotId}|${s.slotDate}`);
    try {
      await fetch(
        `/api/reservations?slotId=${s.slotId}&slotDate=${s.slotDate}`,
        { method: "DELETE" },
      );
      await load();
    } finally {
      setBusy(null);
    }
  }

  if (loading) return <div className="dash-empty">Se încarcă programul…</div>;
  if (slots.length === 0)
    return <div className="dash-empty">Nu sunt sesiuni programate.</div>;

  const byDate = slots.reduce<Record<string, Slot[]>>((acc, s) => {
    acc[s.slotDate] ||= [];
    acc[s.slotDate].push(s);
    return acc;
  }, {});

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {err && (
        <div className="dash-banner dash-banner-error">
          <div className="dash-banner-body">{err}</div>
        </div>
      )}
      {Object.entries(byDate).map(([date, list]) => {
        const dow = list[0].dayOfWeek;
        return (
          <div key={date} className="dash-card">
            <div className="dash-card-head">
              <div>
                <div className="dash-card-eyebrow">{DAYS[dow - 1]}</div>
                <div className="dash-card-title">{fmtDate(date)}</div>
              </div>
            </div>
            <div className="dash-grid-2">
              {list.map((s) => {
                const key = `${s.slotId}|${s.slotDate}`;
                const full = s.taken >= s.capacity;
                return (
                  <div
                    key={key}
                    className="dash-card"
                    style={{
                      padding: "1.15rem",
                      border: s.reserved
                        ? "1px solid rgba(60,220,130,.45)"
                        : undefined,
                    }}
                  >
                    <div className="dash-card-label">
                      {s.startTime.slice(0, 5)} · {s.durationMin}&apos;
                    </div>
                    <div className="dash-card-value" style={{ fontSize: "1.1rem" }}>
                      {s.classType || "Clasă"}
                    </div>
                    <div
                      className="dash-card-meta"
                      style={{ marginBottom: "0.75rem" }}
                    >
                      {s.taken}/{s.capacity} ocupate
                    </div>
                    {s.reserved ? (
                      <button
                        className="dash-btn dash-btn-light"
                        disabled={busy === key}
                        onClick={() => cancel(s)}
                      >
                        {busy === key ? "…" : "Anulează"}
                      </button>
                    ) : (
                      <button
                        className="dash-btn dash-btn-primary"
                        disabled={busy === key || full}
                        onClick={() => reserve(s)}
                      >
                        {busy === key ? "…" : full ? "Plin" : "Rezervă"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
