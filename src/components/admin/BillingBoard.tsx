"use client";
import { useEffect, useState } from "react";

type Data = {
  totals: { revenue: number; payments: number; activeSubs: number };
  subs: {
    userEmail: string;
    userName: string | null;
    planName: string | null;
    status: string;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
  }[];
  payments: {
    userEmail: string;
    userName: string | null;
    amount: number;
    currency: string;
    status: string;
    planName: string | null;
    mode: string | null;
    createdAt: string;
  }[];
  credits: {
    userEmail: string;
    userName: string | null;
    available: number;
    consumed: number;
    expired: number;
  }[];
};

function money(amount: number, currency: string) {
  return `${(amount / 100).toFixed(2)} ${currency.toUpperCase()}`;
}

function UserCell({ name, email }: { name: string | null; email: string }) {
  return (
    <td>
      {name || "—"}{" "}
      <span style={{ opacity: 0.55, fontSize: 12, fontFamily: "monospace" }}>{email}</span>
    </td>
  );
}

export default function BillingBoard() {
  const [data, setData] = useState<Data | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/billing")
      .then(async (res) => {
        const d = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(d.error || `Eroare (${res.status})`);
        setData(d);
      })
      .catch((e) => setErr(e instanceof Error ? e.message : "Eroare de rețea."));
  }, []);

  if (err) {
    return (
      <div className="dash-banner dash-banner-error">
        <div className="dash-banner-body">{err}</div>
      </div>
    );
  }
  if (!data) return <div className="dash-empty">Se încarcă…</div>;

  const stats = [
    { label: "Pass-uri active", value: String(data.totals.activeSubs) },
    { label: "Plăți reușite · total", value: money(data.totals.revenue, "ron") },
    { label: "Tranzacții", value: String(data.totals.payments) },
  ];

  return (
    <>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        {stats.map((st) => (
          <div key={st.label} className="dash-card" style={{ textAlign: "center" }}>
            <div className="dash-card-eyebrow">{st.label}</div>
            <div className="dash-card-title" style={{ fontSize: "1.5rem" }}>
              {st.value}
            </div>
          </div>
        ))}
      </div>

      <div className="dash-card" style={{ marginBottom: "1.5rem" }}>
        <div className="dash-card-head">
          <div>
            <div className="dash-card-eyebrow">Abonamente</div>
            <div className="dash-card-title">Pass-uri active</div>
          </div>
        </div>
        {data.subs.length === 0 ? (
          <div className="dash-empty">Niciun abonament activ.</div>
        ) : (
          <div className="dash-table-wrap">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Membru</th>
                  <th>Plan</th>
                  <th>Status</th>
                  <th>Expiră</th>
                </tr>
              </thead>
              <tbody>
                {data.subs.map((s, i) => (
                  <tr key={i}>
                    <UserCell name={s.userName} email={s.userEmail} />
                    <td>{s.planName || "—"}</td>
                    <td style={{ opacity: 0.8 }}>
                      {s.status.toUpperCase()}
                      {s.cancelAtPeriodEnd ? " · se anulează" : ""}
                    </td>
                    <td style={{ opacity: 0.7 }}>
                      {s.currentPeriodEnd
                        ? new Date(s.currentPeriodEnd).toLocaleDateString("ro-RO")
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="dash-card" style={{ marginBottom: "1.5rem" }}>
        <div className="dash-card-head">
          <div>
            <div className="dash-card-eyebrow">Credite de clasă</div>
            <div className="dash-card-title">Per membru</div>
          </div>
        </div>
        {data.credits.length === 0 ? (
          <div className="dash-empty">Niciun credit cumpărat încă.</div>
        ) : (
          <div className="dash-table-wrap">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Membru</th>
                  <th>Disponibile</th>
                  <th>Consumate</th>
                  <th>Expirate</th>
                </tr>
              </thead>
              <tbody>
                {data.credits.map((c, i) => (
                  <tr key={i}>
                    <UserCell name={c.userName} email={c.userEmail} />
                    <td style={{ fontWeight: 700 }}>{c.available}</td>
                    <td style={{ opacity: 0.8 }}>{c.consumed}</td>
                    <td style={{ opacity: 0.6 }}>{c.expired}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="dash-card">
        <div className="dash-card-head">
          <div>
            <div className="dash-card-eyebrow">Plăți</div>
            <div className="dash-card-title">Ultimele {data.payments.length}</div>
          </div>
        </div>
        {data.payments.length === 0 ? (
          <div className="dash-empty">Nicio plată încă.</div>
        ) : (
          <div className="dash-table-wrap">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Membru</th>
                  <th>Plan</th>
                  <th>Sumă</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.payments.map((p, i) => (
                  <tr key={i}>
                    <td style={{ opacity: 0.7 }}>
                      {new Date(p.createdAt).toLocaleDateString("ro-RO")}
                    </td>
                    <UserCell name={p.userName} email={p.userEmail} />
                    <td>{p.planName || p.mode || "—"}</td>
                    <td style={{ fontWeight: 700 }}>{money(p.amount, p.currency)}</td>
                    <td style={{ opacity: 0.8 }}>{p.status.toUpperCase()}</td>
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
