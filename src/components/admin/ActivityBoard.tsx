"use client";
import { useEffect, useState } from "react";

type Data = {
  stats: {
    members: number;
    attendancesTotal: number;
    attendances7: number;
    attendances28: number;
    xp7: number;
  };
  recent: {
    userEmail: string;
    userName: string | null;
    slotDate: string;
    method: string;
    validatedAt: string;
    classType: string | null;
    startTime: string | null;
  }[];
  leaderboard: { email: string; name: string | null; xp: number; runs: number }[];
};

export default function ActivityBoard() {
  const [data, setData] = useState<Data | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/activity")
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

  const s = data.stats;
  const stats = [
    { label: "Membri", value: s.members },
    { label: "Prezențe · 7 zile", value: s.attendances7 },
    { label: "Prezențe · 28 zile", value: s.attendances28 },
    { label: "Prezențe · total", value: s.attendancesTotal },
    { label: "XP acordat · 7 zile", value: s.xp7 },
  ];

  return (
    <>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        {stats.map((st) => (
          <div key={st.label} className="dash-card" style={{ textAlign: "center" }}>
            <div className="dash-card-eyebrow">{st.label}</div>
            <div className="dash-card-title" style={{ fontSize: "1.6rem" }}>
              {st.value}
            </div>
          </div>
        ))}
      </div>

      <div className="dash-card" style={{ marginBottom: "1.5rem" }}>
        <div className="dash-card-head">
          <div>
            <div className="dash-card-eyebrow">Clasament XP</div>
            <div className="dash-card-title">Top 10</div>
          </div>
        </div>
        {data.leaderboard.length === 0 ? (
          <div className="dash-empty">Niciun XP acordat încă.</div>
        ) : (
          <div className="dash-table-wrap">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Membru</th>
                  <th>XP</th>
                  <th>Prezențe</th>
                </tr>
              </thead>
              <tbody>
                {data.leaderboard.map((u, i) => (
                  <tr key={u.email}>
                    <td style={{ opacity: 0.6 }}>{i + 1}</td>
                    <td>
                      {u.name || "—"}{" "}
                      <span style={{ opacity: 0.55, fontSize: 12, fontFamily: "monospace" }}>
                        {u.email}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700 }}>{u.xp}</td>
                    <td style={{ opacity: 0.8 }}>{u.runs}</td>
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
            <div className="dash-card-eyebrow">Check-in-uri</div>
            <div className="dash-card-title">Ultimele {data.recent.length}</div>
          </div>
        </div>
        {data.recent.length === 0 ? (
          <div className="dash-empty">Nicio prezență înregistrată încă.</div>
        ) : (
          <div className="dash-table-wrap">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Data clasei</th>
                  <th>Clasă</th>
                  <th>Membru</th>
                  <th>Metodă</th>
                  <th>Validat la</th>
                </tr>
              </thead>
              <tbody>
                {data.recent.map((a, i) => (
                  <tr key={i}>
                    <td>{a.slotDate}</td>
                    <td style={{ opacity: 0.85 }}>
                      {a.classType || "—"}
                      {a.startTime ? ` · ${a.startTime.slice(0, 5)}` : ""}
                    </td>
                    <td>
                      {a.userName || "—"}{" "}
                      <span style={{ opacity: 0.55, fontSize: 12, fontFamily: "monospace" }}>
                        {a.userEmail}
                      </span>
                    </td>
                    <td style={{ opacity: 0.7 }}>{a.method.toUpperCase()}</td>
                    <td style={{ opacity: 0.65 }}>
                      {new Date(a.validatedAt).toLocaleString("ro-RO", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
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
