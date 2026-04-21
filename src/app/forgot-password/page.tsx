"use client";
import { useState } from "react";
import Link from "next/link";
import AuthShell from "@/components/auth/AuthShell";
import Field from "@/components/auth/Field";
import SubmitButton from "@/components/auth/SubmitButton";
import Alert from "@/components/auth/Alert";

function ForgotForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setLoading(false);
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setErr(data.error ?? "Nu am putut trimite linkul.");
        return;
      }
      setSent(true);
    } catch {
      setErr("Eroare de rețea.");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-7">
      <header>
        <div className="text-[0.62rem] uppercase tracking-[0.35em] font-black text-[var(--sun)] mb-3">
          Recuperare parolă
        </div>
        <h2
          className="text-2xl md:text-[1.8rem] font-black tracking-tight leading-tight"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Ai uitat parola?
        </h2>
        <p className="text-sm opacity-70 mt-3">
          Lasă-ți emailul și îți trimitem un link de resetare. Linkul e valabil o oră.
        </p>
      </header>

      {sent ? (
        <div className="space-y-4">
          <Alert kind="success">
            Dacă există un cont cu <strong>{email}</strong>, ți-am trimis un email cu
            linkul de resetare. Verifică inbox-ul și folderul de spam.
          </Alert>
          <Link
            href="/login"
            className="block w-full text-center rounded-xl py-3 text-xs uppercase tracking-[0.25em] font-bold transition"
            style={{
              border: "1px solid rgba(255,255,255,0.18)",
              background: "rgba(255,255,255,0.04)",
            }}
          >
            ← Înapoi la login
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <Field
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            autoComplete="email"
            required
            placeholder="tu@exemplu.com"
          />
          {err && <Alert>{err}</Alert>}
          <SubmitButton loading={loading} loadingLabel="Se trimite…">
            Trimite linkul
          </SubmitButton>
          <Link
            href="/login"
            className="block w-full text-center text-[0.62rem] uppercase tracking-[0.3em] font-bold opacity-55 hover:opacity-100 transition pt-1"
          >
            ← Înapoi la login
          </Link>
        </form>
      )}
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      eyebrow="Recuperare acces"
      headline="Te ducem"
      headlineAccent="înapoi acasă."
      sub="Un pas simplu: emailul tău. Îți trimitem un link securizat cu care îți setezi o parolă nouă."
      bullets={[
        {
          title: "Link valabil 1 oră",
          desc: "După, cere altul — e rapid.",
        },
        {
          title: "Fără secrete la noi",
          desc: "Parolele sunt criptate — nici noi nu le vedem.",
        },
      ]}
    >
      <ForgotForm />
    </AuthShell>
  );
}
