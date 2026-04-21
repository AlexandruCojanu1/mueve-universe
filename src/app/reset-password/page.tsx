"use client";
import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import AuthShell from "@/components/auth/AuthShell";
import Field from "@/components/auth/Field";
import SubmitButton from "@/components/auth/SubmitButton";
import Alert from "@/components/auth/Alert";

function ResetForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const token = sp.get("token") || "";
  const email = sp.get("email") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const missingParams = !token || !email;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (password.length < 8) {
      setErr("Parola trebuie să aibă minim 8 caractere.");
      return;
    }
    if (password !== confirm) {
      setErr("Parolele nu se potrivesc.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, password }),
      });
      setLoading(false);
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setErr(data.error ?? "Nu am putut reseta parola.");
        return;
      }
      setDone(true);
      setTimeout(() => router.push("/login"), 1800);
    } catch {
      setErr("Eroare de rețea.");
      setLoading(false);
    }
  }

  return (
    <div className="auth-form">
      <header className="auth-form-head">
        <div className="auth-form-eyebrow">Parolă nouă</div>
        <h2 className="auth-form-title">Setează o parolă nouă</h2>
        {email && (
          <p className="auth-form-sub">
            Cont: <strong>{email}</strong>
          </p>
        )}
      </header>

      {missingParams ? (
        <div className="auth-form-body">
          <Alert>
            Linkul nu conține token valid. Cere altul din pagina{" "}
            <Link href="/forgot-password" className="auth-legal-link">
              recuperare parolă
            </Link>
            .
          </Alert>
        </div>
      ) : done ? (
        <div className="auth-form-body">
          <Alert kind="success">
            Parola a fost actualizată. Te redirecționăm la login…
          </Alert>
        </div>
      ) : (
        <form onSubmit={submit} className="auth-form-body">
          <Field
            label="Parolă nouă"
            type="password"
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
            required
            hint="Minim 8 caractere."
          />
          <Field
            label="Confirmă parola"
            type="password"
            value={confirm}
            onChange={setConfirm}
            autoComplete="new-password"
            required
          />
          {err && <Alert>{err}</Alert>}
          <SubmitButton loading={loading} loadingLabel="Se salvează…">
            Salvează parola
          </SubmitButton>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthShell
      eyebrow="Ultimul pas"
      headline="Alege o parolă"
      headlineAccent="nouă."
      sub="Parolele sunt stocate criptat (bcrypt). Nici noi nu le vedem — doar tu o știi."
      bullets={[
        { title: "Minim 8 caractere", desc: "Mai lungă = mai sigură." },
        {
          title: "Link de unică folosință",
          desc: "După ce setezi parola, tokenul expiră.",
        },
      ]}
    >
      <Suspense fallback={<div style={{ opacity: 0.6, fontSize: "0.85rem" }}>…</div>}>
        <ResetForm />
      </Suspense>
    </AuthShell>
  );
}
