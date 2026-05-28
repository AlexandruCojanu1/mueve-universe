"use client";
import { useEffect, useState } from "react";

type Slot = {
  id: string;
  coachId: string;
  coachName: string | null;
  coachEmail: string;
  dayOfWeek: number;
  startTime: string;
  durationMin: number;
  classType: string;
  capacity: number;
  active: boolean;
};

type Coach = { id: string; name: string | null; email: string; role: string };

const DAYS = ["Luni", "Marți", "Miercuri", "Joi", "Vineri", "Sâmbătă", "Duminică"];

export default function SlotsManager() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    coachId: "",
    dayOfWeek: 1,
    startTime: "18:00",
    durationMin: 60,
    classType: "",
    capacity: 20,
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/slots");
    const data = await res.json();
    setSlots(data.slots || []);
    setCoaches(data.coaches || []);
    if (!form.coachId && data.coaches?.[0]) {
      setForm((f) => ({ ...f, coachId: data.coaches[0].id }));
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/admin/slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) setErr(data.error || "Eroare");
      else {
        setForm({ ...form, classType: "" });
        load();
      }
    } finally {
      setBusy(false);
    }
  }

  async function patch(id: string, body: Partial<Slot>) {
    await fetch("/api/admin/slots", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...body }),
    });
    load();
  }

  async function remove(id: string) {
    if (!confirm("Ștergi slot-ul?")) return;
    await fetch(`/api/admin/slots?id=${id}`, { method: "DELETE" });
    load();
  }

  return (
    <>
      <div className="dash-card">
        <div className="dash-card-head">
          <div>
            <div className="dash-card-eyebrow">Creează</div>
            <div className="dash-card-title">Slot nou</div>
          </div>
        </div>
        <form
          onSubmit={create}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "1rem",
          }}
        >
          <label className="field-col">
            <span className="field-label">Coach</span>
            <select
              className="field-input"
              value={form.coachId}
              onChange={(e) => setForm({ ...form, coachId: e.target.value })}
              required
            >
              <option value="">—</option>
              {coaches.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name || c.email} {c.role === "admin" ? "(admin)" : ""}
                </option>
              ))}
            </select>
          </label>
          <label className="field-col">
            <span className="field-label">Zi</span>
            <select
              className="field-input"
              value={form.dayOfWeek}
              onChange={(e) =>
                setForm({ ...form, dayOfWeek: Number(e.target.value) })
              }
            >
              {DAYS.map((d, i) => (
                <option key={i} value={i + 1}>
                  {d}
                </option>
              ))}
            </select>
          </label>
          <label className="field-col">
            <span className="field-label">Oră start</span>
            <input
              className="field-input"
              type="time"
              value={form.startTime}
              onChange={(e) => setForm({ ...form, startTime: e.target.value })}
              required
            />
          </label>
          <label className="field-col">
            <span className="field-label">Durată (min)</span>
            <input
              className="field-input"
              type="number"
              min={15}
              value={form.durationMin}
              onChange={(e) =>
                setForm({ ...form, durationMin: Number(e.target.value) })
              }
            />
          </label>
          <label className="field-col">
            <span className="field-label">Tip clasă</span>
            <input
              className="field-input"
              value={form.classType}
              onChange={(e) => setForm({ ...form, classType: e.target.value })}
              placeholder="Reggaeton / Hip Hop"
            />
          </label>
          <label className="field-col">
            <span className="field-label">Capacitate</span>
            <input
              className="field-input"
              type="number"
              min={1}
              value={form.capacity}
              onChange={(e) =>
                setForm({ ...form, capacity: Number(e.target.value) })
              }
            />
          </label>
          <div style={{ gridColumn: "1 / -1", display: "flex", gap: 12, alignItems: "center" }}>
            <button className="dash-btn dash-btn-primary" disabled={busy}>
              {busy ? "Adaug…" : "Adaugă slot"}
            </button>
            {err && <span style={{ color: "#ff8080" }}>{err}</span>}
          </div>
        </form>
      </div>

      <div className="dash-card" style={{ marginTop: "1.5rem" }}>
        <div className="dash-card-head">
          <div>
            <div className="dash-card-eyebrow">Calendar</div>
            <div className="dash-card-title">Toate slot-urile</div>
          </div>
        </div>
        {loading ? (
          <div className="dash-empty">Se încarcă…</div>
        ) : slots.length === 0 ? (
          <div className="dash-empty">Niciun slot creat.</div>
        ) : (
          <div className="dash-table-wrap">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Zi</th>
                  <th>Ora</th>
                  <th>Durată</th>
                  <th>Tip</th>
                  <th>Coach</th>
                  <th>Cap.</th>
                  <th>Activ</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {slots.map((s) => (
                  <tr key={s.id}>
                    <td>{DAYS[s.dayOfWeek - 1]}</td>
                    <td>{s.startTime.slice(0, 5)}</td>
                    <td>{s.durationMin}&apos;</td>
                    <td>
                      <input
                        className="field-input"
                        defaultValue={s.classType}
                        onBlur={(e) =>
                          e.target.value !== s.classType &&
                          patch(s.id, { classType: e.target.value })
                        }
                      />
                    </td>
                    <td style={{ opacity: 0.8 }}>{s.coachName || s.coachEmail}</td>
                    <td style={{ width: 80 }}>
                      <input
                        className="field-input"
                        type="number"
                        min={1}
                        defaultValue={s.capacity}
                        onBlur={(e) =>
                          Number(e.target.value) !== s.capacity &&
                          patch(s.id, { capacity: Number(e.target.value) })
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="checkbox"
                        checked={s.active}
                        onChange={(e) =>
                          patch(s.id, { active: e.target.checked })
                        }
                      />
                    </td>
                    <td>
                      <button
                        className="dash-btn dash-btn-light"
                        onClick={() => remove(s.id)}
                      >
                        Șterge
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
