"use client";
import { useEffect, useState } from "react";

type Result = {
  valid: boolean;
  member?: { name: string | null; email: string; image: string | null };
  pass?: { planName: string | null; periodEnd: string | null } | null;
  discount?: {
    percent: number;
    description: string;
    company: string;
    logoUrl?: string | null;
  };
  reason?: string | null;
};

export default function PartnerVerifyClient({
  token,
  memberEmail,
}: {
  token: string;
  memberEmail: string | null;
}) {
  const [state, setState] = useState<"loading" | "ok" | "err">("loading");
  const [data, setData] = useState<Result | null>(null);
  const [msg, setMsg] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const res = await fetch("/api/partner/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const json = (await res.json().catch(() => ({}))) as Result & { error?: string };
        if (cancelled) return;
        if (res.ok) {
          setData(json);
          setState(json.valid ? "ok" : "err");
          if (!json.valid) setMsg(json.reason || "Membru invalid.");
        } else {
          setState("err");
          setMsg(json.error || json.reason || "Validare eșuată.");
        }
      } catch {
        if (!cancelled) {
          setState("err");
          setMsg("Eroare de rețea.");
        }
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (state === "loading") {
    return (
      <div className="q-card q-card-loading">
        <div className="q-card-eyebrow">Verificare</div>
        <div className="q-card-title">Se verifică QR-ul…</div>
        {memberEmail && <div className="q-card-sub">{memberEmail}</div>}
      </div>
    );
  }

  if (state === "ok" && data?.valid) {
    return (
      <div className="q-card q-card-ok">
        <div className="q-card-badge">✓ MEMBRU VALID</div>
        <div className="q-card-title">{data.member?.name || data.member?.email}</div>
        {data.member?.name && <div className="q-card-sub">{data.member.email}</div>}

        <div className="q-discount">
          {data.discount?.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={data.discount.logoUrl}
              alt={data.discount.company}
              className="q-discount-logo"
            />
          )}
          <div className="q-discount-company">{data.discount?.company}</div>
          <div className="q-discount-label">Aplică reducerea</div>
          <div className="q-discount-val">-{data.discount?.percent}%</div>
          {data.discount?.description && (
            <div className="q-discount-desc">{data.discount.description}</div>
          )}
        </div>

        {data.pass?.periodEnd && (
          <div className="q-card-foot">
            Pass{data.pass.planName ? ` ${data.pass.planName}` : ""} · valabil până la{" "}
            {new Date(data.pass.periodEnd).toLocaleDateString("ro-RO")}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="q-card q-card-error">
      <div className="q-card-badge q-card-badge-err">✕ REFUZAT</div>
      <div className="q-card-title">{data?.member?.name || data?.member?.email || "Membru"}</div>
      {data?.member?.email && data?.member?.name && (
        <div className="q-card-sub">{data.member.email}</div>
      )}
      <div className="q-card-body">{msg || "Nu are Pass activ."}</div>
    </div>
  );
}
