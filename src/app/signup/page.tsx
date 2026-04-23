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

function SignupForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const from = sp.get("from") || "/dashboard";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const hasGoogle = true;
  const hasApple = process.env.NEXT_PUBLIC_AUTH_APPLE === "1";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name || undefined, email, password }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setErr(data.error ?? "Nu am putut crea contul.");
        setLoading(false);
        return;
      }
      const signRes = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      setLoading(false);
      if (signRes?.error) {
        router.push("/login");
        return;
      }
      router.push(from);
      router.refresh();
    } catch {
      setErr("Eroare de rețea. Reîncearcă.");
      setLoading(false);
    }
  }

  return (
    <div className="auth-form">
      <header className="auth-form-head">
        <div className="auth-form-eyebrow">Cont nou</div>
        <h2 className="auth-form-title">Creează-ți contul</h2>
        <p className="auth-form-sub">
          Ai deja cont?{" "}
          <Link
            href={`/login?from=${encodeURIComponent(from)}`}
            className="auth-form-link"
          >
            Intră →
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
          label="Nume"
          type="text"
          value={name}
          onChange={setName}
          autoComplete="name"
          placeholder="Cum îți spunem?"
        />
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
          autoComplete="new-password"
          required
          hint="Minim 8 caractere."
        />

        {err && <Alert>{err}</Alert>}

        <SubmitButton loading={loading} loadingLabel="Se creează contul…">
          Creează cont
        </SubmitButton>
      </form>

      <p className="auth-legal">
        Prin crearea contului accepți{" "}
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

export default function SignupPage() {
  return (
    <AuthShell
      eyebrow="Intră în universul mișcării"
      headline="Începe"
      headlineAccent="ritualul."
      sub="Cont gratuit. Fără carduri la înregistrare. Alegi abonamentul după ce intri."
      bullets={[
        {
          title: "Prima sesiune gratuită",
          desc: "Testează orice lume — calisthenics, yoga, alergare.",
        },
        {
          title: "Cont unic",
          desc: "Rezervări, abonament, wallet digital — într-un loc.",
        },
        {
          title: "Anulare oricând",
          desc: "Zero obligație. Rămâi atâta timp cât îți place.",
        },
      ]}
    >
      <Suspense fallback={<div style={{ opacity: 0.6, fontSize: "0.85rem" }}>…</div>}>
        <SignupForm />
      </Suspense>
    </AuthShell>
  );
}
