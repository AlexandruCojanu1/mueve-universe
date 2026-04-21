"use client";
import { useEffect, useState } from "react";

type Profile = {
  id: string;
  companyName: string;
  discountPercent: number;
  discountDescription: string;
  logoUrl: string | null;
};

export default function PartnerSettingsForm() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState({
    companyName: "",
    discountDescription: "",
    logoUrl: "",
  });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/partner/profile");
        const data = await res.json();
        if (data.partner) {
          setProfile(data.partner);
          setForm({
            companyName: data.partner.companyName ?? "",
            discountDescription: data.partner.discountDescription ?? "",
            logoUrl: data.partner.logoUrl ?? "",
          });
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/partner/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setProfile(data.partner);
        setMsg({ ok: true, text: "Salvat." });
      } else {
        setMsg({ ok: false, text: data.error || "Eroare" });
      }
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className="dash-empty">Se încarcă…</div>;
  if (!profile)
    return (
      <div className="dash-empty">
        Contul tău nu are profil de partener configurat. Contactează echipa
        Mueve.
      </div>
    );

  return (
    <form
      onSubmit={save}
      className="dash-card"
      style={{ display: "grid", gap: "1rem" }}
    >
      <div>
        <div className="dash-card-eyebrow">Reducere</div>
        <div
          className="dash-card-title"
          style={{ fontSize: "1.8rem", color: "var(--sun)" }}
        >
          -{profile.discountPercent}%
        </div>
        <div style={{ fontSize: ".8rem", opacity: 0.6 }}>
          Procentul se stabilește cu echipa Mueve.
        </div>
      </div>
      <label className="field-col">
        <span className="field-label">Nume firmă</span>
        <input
          className="field-input"
          required
          value={form.companyName}
          onChange={(e) => setForm({ ...form, companyName: e.target.value })}
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
      <label className="field-col">
        <span className="field-label">URL logo firmă</span>
        <input
          className="field-input"
          type="url"
          value={form.logoUrl}
          onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
          placeholder="https://cdn.firma.ro/logo.png"
        />
        {form.logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={form.logoUrl}
            alt="Preview"
            style={{
              marginTop: 8,
              maxHeight: 60,
              objectFit: "contain",
              background: "rgba(255,255,255,.05)",
              padding: 8,
              borderRadius: 8,
            }}
          />
        )}
      </label>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <button className="dash-btn dash-btn-primary" disabled={busy}>
          {busy ? "Salvez…" : "Salvează"}
        </button>
        {msg && (
          <span style={{ color: msg.ok ? "#4cea9e" : "#ff8080" }}>
            {msg.text}
          </span>
        )}
      </div>
    </form>
  );
}
