"use client";
import { useCallback, useEffect, useState } from "react";

type Order = {
  sessionId: string;
  paymentIntentId: string | null;
  createdAt: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  size: string | null;
  quantity: number;
  amount: number;
  currency: string;
  address: string | null;
  fulfilled: boolean;
  invoice: { series: string | null; number: string | null; link: string | null } | null;
};

function money(amount: number, currency: string) {
  return `${(amount / 100).toFixed(2)} ${currency.toUpperCase()}`;
}

export default function OrdersBoard() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(() => {
    fetch("/api/admin/orders")
      .then(async (res) => {
        const d = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(d.error || `Eroare (${res.status})`);
        setOrders(d.orders);
      })
      .catch((e) => setErr(e instanceof Error ? e.message : "Eroare de rețea."));
  }, []);

  useEffect(load, [load]);

  async function toggleFulfilled(o: Order) {
    if (!o.paymentIntentId) return;
    setBusy(o.sessionId);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentIntentId: o.paymentIntentId, fulfilled: !o.fulfilled }),
      });
      if (!res.ok) throw new Error();
      setOrders((prev) =>
        prev?.map((x) =>
          x.sessionId === o.sessionId ? { ...x, fulfilled: !o.fulfilled } : x,
        ) ?? null,
      );
    } catch {
      setErr("Nu am putut actualiza comanda. Reîncearcă.");
    } finally {
      setBusy(null);
    }
  }

  if (err && !orders) {
    return (
      <div className="dash-banner dash-banner-error">
        <div className="dash-banner-body">{err}</div>
      </div>
    );
  }
  if (!orders) return <div className="dash-empty">Se încarcă…</div>;

  const pieces = orders.reduce((s, o) => s + o.quantity, 0);
  const revenue = orders.reduce((s, o) => s + o.amount, 0);
  const pending = orders.filter((o) => !o.fulfilled).length;
  const bySize = new Map<string, number>();
  for (const o of orders) {
    const key = o.size || "?";
    bySize.set(key, (bySize.get(key) ?? 0) + o.quantity);
  }
  const sizeLine = ["S", "M", "L", "XL", "XXL", "?"]
    .filter((s) => bySize.has(s))
    .map((s) => `${s} ×${bySize.get(s)}`)
    .join(" · ");

  const stats = [
    { label: "Comenzi", value: String(orders.length) },
    { label: "Tricouri", value: String(pieces) },
    { label: "Încasat", value: money(revenue, "ron") },
    { label: "De expediat", value: String(pending) },
  ];

  return (
    <>
      {err ? (
        <div className="dash-banner dash-banner-error" style={{ marginBottom: "1rem" }}>
          <div className="dash-banner-body">{err}</div>
        </div>
      ) : null}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
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

      <div className="dash-card">
        <div className="dash-card-head">
          <div>
            <div className="dash-card-eyebrow">MUEVE CLUB TEE</div>
            <div className="dash-card-title">Comenzi tricouri</div>
            {sizeLine ? (
              <div style={{ opacity: 0.6, fontSize: 13, marginTop: 4 }}>
                Pe mărimi: {sizeLine}
              </div>
            ) : null}
          </div>
        </div>
        {orders.length === 0 ? (
          <div className="dash-empty">Nicio comandă încă.</div>
        ) : (
          <div className="dash-table-wrap">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Client</th>
                  <th>Telefon</th>
                  <th>Mărime</th>
                  <th>Buc.</th>
                  <th>Adresă</th>
                  <th>Sumă</th>
                  <th>Factură</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.sessionId} style={o.fulfilled ? { opacity: 0.55 } : undefined}>
                    <td style={{ opacity: 0.7, whiteSpace: "nowrap" }}>
                      {new Date(o.createdAt).toLocaleDateString("ro-RO")}
                    </td>
                    <td>
                      {o.name || "—"}{" "}
                      <span style={{ opacity: 0.55, fontSize: 12, fontFamily: "monospace" }}>
                        {o.email || ""}
                      </span>
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>{o.phone || "—"}</td>
                    <td style={{ fontWeight: 700 }}>{o.size || "—"}</td>
                    <td>{o.quantity}</td>
                    <td style={{ maxWidth: 260 }}>{o.address || "—"}</td>
                    <td style={{ fontWeight: 700, whiteSpace: "nowrap" }}>
                      {money(o.amount, o.currency)}
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      {o.invoice ? (
                        o.invoice.link ? (
                          <a href={o.invoice.link} target="_blank" rel="noreferrer">
                            {o.invoice.series || ""} {o.invoice.number || ""}
                          </a>
                        ) : (
                          `${o.invoice.series || ""} ${o.invoice.number || ""}`
                        )
                      ) : (
                        <span style={{ opacity: 0.5 }}>—</span>
                      )}
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      <button
                        className="dash-btn"
                        style={{ height: 34, padding: "0 0.8rem", fontSize: "0.6rem" }}
                        disabled={busy === o.sessionId || !o.paymentIntentId}
                        onClick={() => toggleFulfilled(o)}
                      >
                        {busy === o.sessionId
                          ? "…"
                          : o.fulfilled
                            ? "Expediat ✓"
                            : "Marchează expediat"}
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
