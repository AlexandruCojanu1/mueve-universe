"use client";
import { useEffect, useState } from "react";

export type Slot = {
  slotId: string;
  slotDate: string;
  dayOfWeek: number;
  startTime: string;
  durationMin: number;
  classType: string;
  capacity: number;
  unlimited: boolean;
  free: boolean;
  taken: number;
  reserved: boolean;
};

const RO_DAYS = ["Duminică", "Luni", "Marți", "Miercuri", "Joi", "Vineri", "Sâmbătă"];

function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function dayLabel(slotDate: string): string {
  const now = new Date();
  const today = isoDate(now);
  const tmrw = isoDate(new Date(now.getTime() + 86400000));
  if (slotDate === today) return "AZI";
  if (slotDate === tmrw) return "MÂINE";
  const d = new Date(slotDate + "T00:00:00");
  return (RO_DAYS[d.getDay()] || "").toUpperCase();
}

function subLabel(slotDate: string): string {
  return slotDate.slice(5).replace("-", ".");
}

function colorFor(classType: string): "yellow" | "purple" | "blue" | "orange" {
  const t = (classType || "").toLowerCase();
  if (/yoga/.test(t)) return "purple";
  if (/calisthenic/.test(t)) return "blue";
  if (/run|alerg/.test(t)) return "orange";
  return "yellow";
}

// Class start in venue-local time; free cancellation closes 2h before it.
function classStart(s: Slot): Date {
  return new Date(`${s.slotDate}T${(s.startTime || "00:00:00").slice(0, 8)}`);
}
function freeCancelDeadline(s: Slot): Date {
  return new Date(classStart(s).getTime() - 2 * 3600_000);
}
function humanizeLeft(ms: number): string {
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function ReserveBoard({ initialSlots }: { initialSlots?: Slot[] }) {
  const [slots, setSlots] = useState<Slot[]>(initialSlots ?? []);
  const [loading, setLoading] = useState(!initialSlots);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  // Re-render every 30s so the free-cancel countdown stays live.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  async function load() {
    try {
      const res = await fetch("/api/slots/available");
      const data = await res.json();
      setSlots(data.slots || []);
    } catch {
      /* keep current state on transient errors */
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!initialSlots) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setErr(data.error || "Eroare la rezervare.");
      await load();
    } finally {
      setBusy(null);
    }
  }

  async function cancel(s: Slot) {
    const late = Date.now() > freeCancelDeadline(s).getTime();
    const msg = late
      ? "Anulezi sub 2h înainte — creditul NU se returnează. Continui?"
      : "Anulezi rezervarea? Creditul se întoarce.";
    if (!confirm(msg)) return;
    setBusy(`${s.slotId}|${s.slotDate}`);
    try {
      await fetch(`/api/reservations?slotId=${s.slotId}&slotDate=${s.slotDate}`, {
        method: "DELETE",
      });
      await load();
    } finally {
      setBusy(null);
    }
  }

  if (loading) return <div className="m-empty">Se încarcă sesiunile…</div>;
  if (slots.length === 0)
    return <div className="m-empty">Nu sunt sesiuni programate momentan.</div>;

  const byDate: Record<string, Slot[]> = {};
  for (const s of slots) (byDate[s.slotDate] ||= []).push(s);

  return (
    <div className="m-reserve">
      {err && <div className="m-reserve-err">{err}</div>}
      {Object.entries(byDate).map(([date, list]) => (
        <section className="m-day" key={date}>
          <div className="m-day-head">
            <span className="m-day-label">{dayLabel(date)}</span>
            <span className="m-day-sub">{subLabel(date)}</span>
          </div>
          <div className="m-day-slots">
            {list.map((s) => {
              const key = `${s.slotId}|${s.slotDate}`;
              const full = !s.unlimited && s.taken >= s.capacity;
              const isBusy = busy === key;
              return (
                <div className="m-slot" data-c={colorFor(s.classType)} key={key}>
                  <span className="m-slot-time">{s.startTime.slice(0, 5)}</span>
                  <span className="m-slot-main">
                    <span className="m-slot-act">
                      {s.classType || "Clasă"}
                      {s.free && <span className="m-slot-free">GRATIS</span>}
                    </span>
                    <span className="m-slot-world">
                      <span className="m-slot-dot" />
                      {s.unlimited ? "În aer liber" : `${s.taken}/${s.capacity} locuri`}
                    </span>
                  </span>
                  {s.reserved ? (
                    (() => {
                      const freeLeft = freeCancelDeadline(s).getTime() - now;
                      const inWindow = freeLeft > 0;
                      const hint = s.free
                        ? "Sesiune gratuită"
                        : inWindow
                          ? `Anulare gratuită · încă ${humanizeLeft(freeLeft)}`
                          : "Sub 2h · creditul nu se mai întoarce";
                      return (
                        <span className="m-slot-resv">
                          <button
                            type="button"
                            className="m-slot-btn m-slot-btn-on"
                            disabled={isBusy}
                            onClick={() => cancel(s)}
                            title="Apasă pentru a anula rezervarea"
                          >
                            {isBusy ? "…" : "Rezervat ✓ · Anulează"}
                          </button>
                          <span
                            className="m-slot-cancelhint"
                            style={{
                              fontSize: "0.62rem",
                              marginTop: 3,
                              opacity: 0.85,
                              color: s.free
                                ? undefined
                                : inWindow
                                  ? "var(--ok, #7CFC6B)"
                                  : "var(--warn, #FF6B6B)",
                            }}
                          >
                            {hint}
                          </span>
                        </span>
                      );
                    })()
                  ) : (
                    <button
                      type="button"
                      className="m-slot-btn"
                      disabled={isBusy || full}
                      onClick={() => reserve(s)}
                    >
                      {isBusy ? "…" : full ? "Plin" : "Rezervă"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
