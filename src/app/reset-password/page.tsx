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
    <div className="space-y-7">
      <header>
        <div className="text-[0.62rem] uppercase tracking-[0.35em] font-black text-[var(--sun)] mb-3">
          Parolă nouă
        </div>
        <h2
          className="text-2xl md:text-[1.8rem] font-black tracking-tight leading-tight"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Setează o parolă nouă
        </h2>
        {email && (
          <p className="text-sm opacity-70 mt-3">
            Cont: <strong>{email}</strong>
          </p>
        )}
      </header>

      {missingParams ? (
        <div className="space-y-4">
          <Alert>
            Linkul nu conține token valid. Cere altul din pagina{" "}
            <Link href="/forgot-password" className="underline font-bold">
              recuperare parolă
            </Link>
            .
          </Alert>
        </div>
      ) : done ? (
        <div className="space-y-4">
          <Alert kind="success">
            Parola a fost actualizată. Te redirecționăm la login…
          </Alert>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
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
        { title: "Link de unică folosință", desc: "După ce setezi parola, tokenul expiră." },
      ]}
    >
      <Suspense fallback={<div className="opacity-60 text-sm">…</div>}>
        <ResetForm />
      </Suspense>
    </AuthShell>
  );
}
