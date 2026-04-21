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
    <div className="auth-form">
      <header className="auth-form-head">
        <div className="auth-form-eyebrow">Recuperare parolă</div>
        <h2 className="auth-form-title">Ai uitat parola?</h2>
        <p className="auth-form-sub">
          Lasă-ți emailul și îți trimitem un link de resetare. Linkul e valabil o oră.
        </p>
      </header>

      {sent ? (
        <div className="auth-form-body">
          <Alert kind="success">
            Dacă există un cont cu <strong>{email}</strong>, ți-am trimis un email cu
            linkul de resetare. Verifică inbox-ul și folderul de spam.
          </Alert>
          <Link href="/login" className="auth-secondary-btn">
            ← Înapoi la login
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} className="auth-form-body">
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
          <Link href="/login" className="auth-back-link">
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
        { title: "Link valabil 1 oră", desc: "După, cere altul — e rapid." },
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
