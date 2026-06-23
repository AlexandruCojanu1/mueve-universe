"use client";
import { Suspense, useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import AuthShell from "@/components/auth/AuthShell";
import Field from "@/components/auth/Field";
import ProviderButtons from "@/components/auth/ProviderButtons";
import Divider from "@/components/auth/Divider";
import SubmitButton from "@/components/auth/SubmitButton";
import Alert from "@/components/auth/Alert";

function LoginForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const fromRaw = sp.get("from");
  const from = fromRaw || "/dashboard";

  async function resolveRedirect(): Promise<string> {
    if (fromRaw) return fromRaw;
    try {
      const res = await fetch("/api/auth/session");
      const s = await res.json();
      const role = s?.user?.role;
      if (role === "partner") return "/partner";
      if (role === "admin") return "/admin";
      if (role === "coach") return "/coach";
    } catch {}
    return "/dashboard";
  }

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const hasGoogle = true;
  const hasApple = true;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) {
      setErr("Email sau parolă greșite.");
      return;
    }
    const to = await resolveRedirect();
    router.push(to);
    router.refresh();
  }

  return (
    <div className="auth-form">
      <header className="auth-form-head">
        <div className="auth-form-eyebrow">Autentificare</div>
        <h2 className="auth-form-title">Intră în cont</h2>
        <p className="auth-form-sub">
          Nu ai încă cont?{" "}
          <Link
            href={`/signup?from=${encodeURIComponent(from)}`}
            className="auth-form-link"
          >
            Creează unul →
          </Link>
        </p>
      </header>

      <ProviderButtons
        callbackUrl={from}
        hasGoogle={hasGoogle}
        hasApple={hasApple}
        hasMagic={false}
      />

      <Divider label="sau cu email" />

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
        <Field
          label="Parolă"
          type="password"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
          required
          rightLink={
            <Link href="/forgot-password" className="auth-small-link">
              Ai uitat?
            </Link>
          }
        />

        {err && <Alert>{err}</Alert>}

        <SubmitButton loading={loading} loadingLabel="Se conectează…">
          Intră
        </SubmitButton>
      </form>

      <p className="auth-legal">
        Prin autentificare accepți{" "}
        <Link href="/terms" className="auth-legal-link">
          Termenii
        </Link>{" "}
        și{" "}
        <Link href="/privacy" className="auth-legal-link">
          Politica de confidențialitate
        </Link>
        .
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <AuthShell
      eyebrow="Universul mișcării"
      headline="Bine ai"
      headlineAccent="revenit."
      bullets={[
        { title: "Toate lumile într-un loc" },
        { title: "Wallet cosmic" },
        { title: "Comunitate reală" },
      ]}
    >
      <Suspense fallback={<div style={{ opacity: 0.6, fontSize: "0.85rem" }}>…</div>}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
