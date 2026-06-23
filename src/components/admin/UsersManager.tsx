"use client";
import { useEffect, useState } from "react";

type Row = {
  id: string;
  email: string;
  name: string | null;
  role: "user" | "coach" | "admin" | "partner";
  createdAt: string;
  emailVerified: string | null;
  hasPartnerProfile: boolean;
};

type Detail = {
  user: {
    createdAt: string;
    walletAddedAt: string | null;
    gender: string | null;
  };
  xp: number;
  attendances: number;
  activeSub: { planName: string | null; status: string; currentPeriodEnd: string | null } | null;
  creditsAvailable: number;
  upcomingReservations: { slotDate: string; status: string }[];
};

const ROLES = ["user", "coach", "admin", "partner"] as const;
const ROLE_LABEL: Record<(typeof ROLES)[number], string> = {
  user: "Utilizator",
  coach: "Coach",
  admin: "Admin",
  partner: "Partener",
};

export default function UsersManager() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [filterRole, setFilterRole] = useState<"" | Row["role"]>("");
  const [note, setNote] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [details, setDetails] = useState<Record<string, Detail | "loading">>({});

  async function load() {
    setLoading(true);
    setErr(null);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (filterRole) params.set("role", filterRole);
    try {
      const res = await fetch(`/api/admin/users?${params.toString()}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(
          res.status === 403
            ? "Nu ai permisiuni de admin — contul tău nu are rolul necesar."
            : data.error || `Eroare (${res.status})`,
        );
        setRows([]);
        return;
      }
      setRows(data.users || []);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Eroare de rețea.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, filterRole]);

  async function resetDevice(u: Row) {
    if (!confirm(`Resetezi binding-ul device pentru ${u.email}?\nUserul va putea apoi rebind pe orice telefon.`)) return;
    setErr(null);
    setNote(null);
    const res = await fetch("/api/admin/users/reset-device", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: u.id }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErr(data.error || "Eroare la reset device.");
      return;
    }
    setNote(`Device legat resetat pentru ${u.email}.`);
  }

  async function toggleDetail(u: Row) {
    if (openId === u.id) {
      setOpenId(null);
      return;
    }
    setOpenId(u.id);
    if (!details[u.id]) {
      setDetails((d) => ({ ...d, [u.id]: "loading" }));
      const res = await fetch(`/api/admin/users/detail?id=${u.id}`);
      const data = await res.json().catch(() => null);
      if (res.ok && data) {
        setDetails((d) => ({ ...d, [u.id]: data as Detail }));
      } else {
        setErr(data?.error || "Eroare la încărcarea detaliilor.");
        setOpenId(null);
      }
    }
  }

  async function removeUser(u: Row) {
    if (
      !confirm(
        `Ștergi DEFINITIV contul ${u.email}?\nDispar prezențele, XP-ul, abonamentele și rezervările lui.`,
      )
    )
      return;
    setErr(null);
    setNote(null);
    const res = await fetch(`/api/admin/users?id=${u.id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(data.error || "Eroare la ștergere.");
      return;
    }
    setNote(`Contul ${u.email} a fost șters.`);
    load();
  }

  async function changeRole(u: Row, newRole: Row["role"]) {
    if (newRole === u.role) return;
    setErr(null);
    setNote(null);
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: u.id, role: newRole }),
    });
    const data = await res.json();
    if (!res.ok) {
      setErr(data.error || "Eroare");
      return;
    }
    if (Array.isArray(data.notes) && data.notes.length) {
      setNote(data.notes.join(" · "));
    }
    load();
  }

  return (
    <>
      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          marginBottom: "1rem",
          flexWrap: "wrap",
        }}
      >
        <input
          className="field-input"
          placeholder="Caută email sau nume…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ flex: 1, minWidth: 240 }}
        />
        <select
          className="field-input"
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value as typeof filterRole)}
          style={{ maxWidth: 180 }}
        >
          <option value="">Toate rolurile</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABEL[r]}
            </option>
          ))}
        </select>
      </div>

      {err && (
        <div
          className="dash-banner dash-banner-error"
          style={{ marginBottom: "1rem" }}
        >
          <div className="dash-banner-body">{err}</div>
        </div>
      )}
      {note && (
        <div
          className="dash-banner dash-banner-info"
          style={{ marginBottom: "1rem" }}
        >
          <div className="dash-banner-body">{note}</div>
          <button
            className="dash-btn dash-btn-light"
            onClick={() => setNote(null)}
          >
            ×
          </button>
        </div>
      )}

      <div className="dash-card">
        <div className="dash-card-head">
          <div>
            <div className="dash-card-eyebrow">Useri</div>
            <div className="dash-card-title">
              {loading ? "…" : `${rows.length} rezultate`}
            </div>
          </div>
        </div>
        {loading ? (
          <div className="dash-empty">Se încarcă…</div>
        ) : rows.length === 0 ? (
          <div className="dash-empty">Niciun user.</div>
        ) : (
          <div className="dash-table-wrap">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Nume</th>
                  <th>Rol</th>
                  <th>Verificat</th>
                  <th>Creat</th>
                  <th>Notă</th>
                  <th>Acțiuni</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((u) => (
                  <UserRow
                    key={u.id}
                    u={u}
                    open={openId === u.id}
                    detail={details[u.id]}
                    onToggle={() => toggleDetail(u)}
                    onChangeRole={(role) => changeRole(u, role)}
                    onResetDevice={() => resetDevice(u)}
                    onDelete={() => removeUser(u)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

function UserRow({
  u,
  open,
  detail,
  onToggle,
  onChangeRole,
  onResetDevice,
  onDelete,
}: {
  u: Row;
  open: boolean;
  detail: Detail | "loading" | undefined;
  onToggle: () => void;
  onChangeRole: (role: Row["role"]) => void;
  onResetDevice: () => void;
  onDelete: () => void;
}) {
  return (
    <>
      <tr>
        <td style={{ fontFamily: "monospace", fontSize: 13 }}>{u.email}</td>
        <td style={{ opacity: 0.8 }}>{u.name || "—"}</td>
        <td>
          <select
            className="field-input"
            value={u.role}
            onChange={(e) => onChangeRole(e.target.value as Row["role"])}
            style={{ minWidth: 130 }}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABEL[r]}
              </option>
            ))}
          </select>
        </td>
        <td style={{ opacity: 0.75 }}>{u.emailVerified ? "✓" : "—"}</td>
        <td style={{ opacity: 0.65 }}>
          {new Date(u.createdAt).toLocaleDateString("ro-RO")}
        </td>
        <td style={{ fontSize: 12, opacity: 0.65 }}>
          {u.role === "partner" && !u.hasPartnerProfile && (
            <span style={{ color: "#ffb86b" }}>profil partener lipsă</span>
          )}
          {u.role !== "partner" && u.hasPartnerProfile && (
            <span style={{ color: "#ffb86b" }}>are profil partener</span>
          )}
        </td>
        <td style={{ whiteSpace: "nowrap" }}>
          <button
            type="button"
            className="dash-btn dash-btn-light"
            style={{ fontSize: 11, padding: "0.3rem 0.6rem", marginRight: 6 }}
            onClick={onToggle}
          >
            {open ? "Închide" : "Detalii"}
          </button>
          <button
            type="button"
            className="dash-btn dash-btn-light"
            style={{ fontSize: 11, padding: "0.3rem 0.6rem", marginRight: 6 }}
            onClick={onResetDevice}
          >
            Reset device
          </button>
          <button
            type="button"
            className="dash-btn dash-btn-light"
            style={{ fontSize: 11, padding: "0.3rem 0.6rem", color: "#ff8080" }}
            onClick={onDelete}
          >
            Șterge
          </button>
        </td>
      </tr>
      {open && (
        <tr>
          <td colSpan={7} style={{ background: "rgba(255,255,255,0.03)", fontSize: 13 }}>
            {!detail || detail === "loading" ? (
              <span style={{ opacity: 0.6 }}>Se încarcă detaliile…</span>
            ) : (
              <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap", padding: "0.5rem 0" }}>
                <span>
                  <strong>{detail.xp}</strong> XP
                </span>
                <span>
                  <strong>{detail.attendances}</strong> prezențe
                </span>
                <span>
                  Pass:{" "}
                  {detail.activeSub
                    ? `${detail.activeSub.planName || "activ"} · ${detail.activeSub.status.toUpperCase()}${
                        detail.activeSub.currentPeriodEnd
                          ? ` · până la ${new Date(detail.activeSub.currentPeriodEnd).toLocaleDateString("ro-RO")}`
                          : ""
                      }`
                    : "—"}
                </span>
                <span>
                  Credite disponibile: <strong>{detail.creditsAvailable}</strong>
                </span>
                <span>
                  Wallet: {detail.user.walletAddedAt ? "✓ adăugat" : "—"}
                </span>
                <span>Gen: {detail.user.gender || "—"}</span>
                <span>
                  Rezervări viitoare:{" "}
                  {detail.upcomingReservations.length === 0
                    ? "—"
                    : detail.upcomingReservations.map((r) => r.slotDate).join(", ")}
                </span>
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}
