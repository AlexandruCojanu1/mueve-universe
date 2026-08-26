"use client";
import { useCallback, useEffect, useState } from "react";

type OrderStatus = "new" | "working" | "delivered" | "cancelled";

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
  amountRefunded: number;
  currency: string;
  address: string | null;
  status: OrderStatus;
  refunded: boolean;
  invoice: { series: string | null; number: string | null; link: string | null } | null;
};

const STATUS_LABEL: Record<OrderStatus, string> = {
  new: "Nouă",
  working: "În lucru",
  delivered: "Predată",
  cancelled: "Anulată",
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

  async function setStatus(o: Order, status: OrderStatus) {
    if (!o.paymentIntentId || status === o.status) return;
    setBusy(o.sessionId);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentIntentId: o.paymentIntentId, status }),
      });
      if (!res.ok) throw new Error();
      setOrders((prev) =>
        prev?.map((x) => (x.sessionId === o.sessionId ? { ...x, status } : x)) ?? null,
      );
      setErr(null);
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

  const active = orders.filter((o) => o.status !== "cancelled" && !o.refunded);
  const pieces = active.reduce((s, o) => s + o.quantity, 0);
  const revenue = orders.reduce((s, o) => s + o.amount - o.amountRefunded, 0);
  const pending = active.filter((o) => o.status === "new" || o.status === "working").length;
  const bySize = new Map<string, number>();
  for (const o of active) {
    const key = o.size || "?";
    bySize.set(key, (bySize.get(key) ?? 0) + o.quantity);
  }
  const sizeLine = ["S", "M", "L", "XL", "XXL", "?"]
    .filter((s) => bySize.has(s))
    .map((s) => `${s} ×${bySize.get(s)}`)
    .join(" · ");
  const anyAddress = orders.some((o) => o.address);

  const stats = [
    { label: "Comenzi", value: String(orders.length) },
    { label: "Tricouri", value: String(pieces) },
    { label: "Încasat net", value: money(revenue, "ron") },
    { label: "De predat", value: String(pending) },
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
                De produs, pe mărimi: {sizeLine}
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
                  {anyAddress ? <th>Adresă</th> : null}
                  <th>Sumă</th>
                  <th>Factură</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => {
                  const dimmed = o.status === "delivered" || o.status === "cancelled" || o.refunded;
                  return (
                    <tr key={o.sessionId} style={dimmed ? { opacity: 0.55 } : undefined}>
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
                      {anyAddress ? <td style={{ maxWidth: 260 }}>{o.address || "—"}</td> : null}
                      <td style={{ fontWeight: 700, whiteSpace: "nowrap" }}>
                        {money(o.amount, o.currency)}
                        {o.amountRefunded > 0 ? (
                          <span style={{ display: "block", fontWeight: 400, fontSize: 12, opacity: 0.7 }}>
                            retur {money(o.amountRefunded, o.currency)}
                          </span>
                        ) : null}
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
                        <select
                          className="dash-btn"
                          style={{ height: 34, padding: "0 0.6rem", fontSize: "0.6rem" }}
                          value={o.status}
                          disabled={busy === o.sessionId || !o.paymentIntentId}
                          onChange={(e) => setStatus(o, e.target.value as OrderStatus)}
                        >
                          {(Object.keys(STATUS_LABEL) as OrderStatus[]).map((s) => (
                            <option key={s} value={s} style={{ color: "#000" }}>
                              {STATUS_LABEL[s]}
                            </option>
                          ))}
                        </select>
                        {o.refunded ? (
                          <span style={{ display: "block", fontSize: 11, opacity: 0.7, marginTop: 2 }}>
                            Refundată în Stripe
                          </span>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
