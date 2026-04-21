"use client";
import { useEffect, useState } from "react";

type Row = {
  partnerId: string;
  companyName: string;
  discountPercent: number;
  discountDescription: string;
  logoUrl: string | null;
  active: boolean;
  userId: string;
  email: string;
  name: string | null;
};

export default function PartnersManager() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [form, setForm] = useState({
    email: "",
    companyName: "",
    discountPercent: 10,
    discountDescription: "",
  });
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/partners");
      const data = await res.json();
      setRows(data.partners || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const res = await fetch("/api/admin/partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error || "Eroare");
      } else {
        setForm({
          email: "",
          companyName: "",
          discountPercent: 10,
          discountDescription: "",
        });
        await load();
      }
    } finally {
      setBusy(false);
    }
  }

  async function patch(id: string, body: Partial<Row>) {
    await fetch("/api/admin/partners", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...body }),
    });
    load();
  }

  async function remove(id: string) {
    if (!confirm("Ștergi partenerul? Contul user rămâne.")) return;
    await fetch(`/api/admin/partners?id=${id}`, { method: "DELETE" });
    load();
  }

  return (
    <>
      <div className="dash-card">
        <div className="dash-card-head">
          <div>
            <div className="dash-card-eyebrow">Creează</div>
            <div className="dash-card-title">Partener nou</div>
          </div>
        </div>
        <form
          onSubmit={create}
          style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1rem" }}
        >
          <label className="field-col">
            <span className="field-label">Email login partener</span>
            <input
              className="field-input"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="contact@cafenea.ro"
            />
          </label>
          <label className="field-col">
            <span className="field-label">Nume firmă</span>
            <input
              className="field-input"
              required
              value={form.companyName}
              onChange={(e) => setForm({ ...form, companyName: e.target.value })}
              placeholder="Cafeneaua X"
            />
          </label>
          <label className="field-col">
            <span className="field-label">Reducere (%)</span>
            <input
              className="field-input"
              type="number"
              min={0}
              max={100}
              value={form.discountPercent}
              onChange={(e) =>
                setForm({ ...form, discountPercent: Number(e.target.value) })
              }
            />
          </label>
          <label className="field-col">
            <span className="field-label">Descriere reducere</span>
            <input
              className="field-input"
              value={form.discountDescription}
              onChange={(e) =>
                setForm({ ...form, discountDescription: e.target.value })
              }
              placeholder="la toată cafeaua"
            />
          </label>
          <div style={{ gridColumn: "1 / -1", display: "flex", gap: 12, alignItems: "center" }}>
            <button className="dash-btn dash-btn-primary" disabled={busy}>
              {busy ? "Creez…" : "Creează partener"}
            </button>
            {err && <span style={{ color: "#ff8080" }}>{err}</span>}
          </div>
        </form>
      </div>

      <div className="dash-card" style={{ marginTop: "1.5rem" }}>
        <div className="dash-card-head">
          <div>
            <div className="dash-card-eyebrow">Toți partenerii</div>
            <div className="dash-card-title">{rows.length} parteneri</div>
          </div>
        </div>
        {loading ? (
          <div className="dash-empty">Se încarcă…</div>
        ) : rows.length === 0 ? (
          <div className="dash-empty">Niciun partener.</div>
        ) : (
          <div className="dash-table-wrap">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Firmă</th>
                  <th>Email</th>
                  <th>Reducere</th>
                  <th>Descriere</th>
                  <th>Activ</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.partnerId}>
                    <td>
                      <input
                        className="field-input"
                        defaultValue={r.companyName}
                        onBlur={(e) =>
                          e.target.value !== r.companyName &&
                          patch(r.partnerId, { companyName: e.target.value })
                        }
                      />
                    </td>
                    <td style={{ opacity: 0.8 }}>{r.email}</td>
                    <td style={{ width: 100 }}>
                      <input
                        className="field-input"
                        type="number"
                        min={0}
                        max={100}
                        defaultValue={r.discountPercent}
                        onBlur={(e) =>
                          Number(e.target.value) !== r.discountPercent &&
                          patch(r.partnerId, {
                            discountPercent: Number(e.target.value),
                          })
                        }
                      />
                    </td>
                    <td>
                      <input
                        className="field-input"
                        defaultValue={r.discountDescription}
                        onBlur={(e) =>
                          e.target.value !== r.discountDescription &&
                          patch(r.partnerId, { discountDescription: e.target.value })
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="checkbox"
                        checked={r.active}
                        onChange={(e) => patch(r.partnerId, { active: e.target.checked })}
                      />
                    </td>
                    <td>
                      <button
                        className="dash-btn dash-btn-light"
                        onClick={() => remove(r.partnerId)}
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
