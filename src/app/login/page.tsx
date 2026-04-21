"use client";
import { Suspense, useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import StarfieldBg from "@/components/site/StarfieldBg";

function LoginForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const from = sp.get("from") || "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"oauth" | "password" | "magic">("oauth");
  const [magicSent, setMagicSent] = useState(false);

  const hasGoogle = process.env.NEXT_PUBLIC_AUTH_GOOGLE === "1";
  const hasApple = process.env.NEXT_PUBLIC_AUTH_APPLE === "1";
  const hasEmail = process.env.NEXT_PUBLIC_AUTH_EMAIL === "1";

  async function submitPassword(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) {
      setErr("Email sau parolă greșită.");
      return;
    }
    router.push(from);
    router.refresh();
  }

  async function submitMagic(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    const res = await signIn("nodemailer", { email, redirect: false, callbackUrl: from });
    setLoading(false);
    if (res?.error) {
      setErr("Nu am putut trimite linkul. Încearcă din nou.");
      return;
    }
    setMagicSent(true);
  }

  return (
    <div className="relative w-full max-w-md">
      <div className="pointer-events-none absolute -inset-10 rounded-[32px] bg-[radial-gradient(closest-side,rgba(245,221,90,0.22),transparent_70%)] blur-2xl" />

      <div className="relative bg-[rgba(10,14,30,0.55)] backdrop-blur-3xl backdrop-saturate-200 border border-white/15 rounded-[28px] p-8 md:p-10 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.75)] ring-1 ring-inset ring-white/10 space-y-6">
        <header className="space-y-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[0.6rem] uppercase tracking-[0.35em] font-bold opacity-60 hover:opacity-100 transition"
          >
            <span aria-hidden>←</span>
            Acasă
          </Link>
          <div>
            <h1
              className="text-3xl md:text-[2.1rem] font-black tracking-tight leading-none"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              MUEVE <span className="text-[var(--sun)]">UNIVERSE</span>
            </h1>
            <p className="text-[0.72rem] uppercase tracking-[0.3em] font-bold opacity-60 mt-3">
              Intră în universul mișcării
            </p>
          </div>
        </header>

        {mode === "oauth" && (
          <div className="space-y-3">
            {hasGoogle && (
              <button
                onClick={() => signIn("google", { callbackUrl: from })}
                className="w-full py-3 rounded-xl border border-white/20 hover:border-white/50 hover:bg-white/5 text-sm font-bold tracking-wide transition"
              >
                Continuă cu Google
              </button>
            )}
            {hasApple && (
              <button
                onClick={() => signIn("apple", { callbackUrl: from })}
                className="w-full py-3 rounded-xl border border-white/20 hover:border-white/50 hover:bg-white/5 text-sm font-bold tracking-wide transition"
              >
                Continuă cu Apple
              </button>
            )}
            {hasEmail && (
              <button
                onClick={() => setMode("magic")}
                className="w-full py-3 rounded-xl border border-white/15 hover:border-white/35 hover:bg-white/5 text-sm font-bold tracking-wide transition"
              >
                Continuă cu email (magic link)
              </button>
            )}

            <button
              onClick={() => setMode("password")}
              className="w-full py-3 rounded-xl bg-[var(--sun)] text-[var(--deep)] font-black uppercase tracking-widest text-xs hover:opacity-90 transition shadow-[0_10px_30px_-10px_rgba(245,221,90,0.8)]"
            >
              Intră cu email și parolă
            </button>

            {!hasGoogle && !hasApple && !hasEmail && (
              <p className="text-[0.65rem] uppercase tracking-widest opacity-45 text-center pt-1">
                OAuth și magic link se activează în curând.
              </p>
            )}
          </div>
        )}

        {mode === "password" && (
          <form onSubmit={submitPassword} className="space-y-4">
            <Field
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              autoComplete="email"
              required
            />
            <Field
              label="Parolă"
              type="password"
              value={password}
              onChange={setPassword}
              autoComplete="current-password"
              required
            />
            {err && (
              <div className="text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-md px-3 py-2">
                {err}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[var(--sun)] text-[var(--deep)] font-black tracking-widest text-xs uppercase disabled:opacity-50 hover:opacity-90 transition shadow-[0_10px_30px_-10px_rgba(245,221,90,0.8)]"
            >
              {loading ? "Se conectează…" : "Intră"}
            </button>
            <BackButton onClick={() => setMode("oauth")} />
          </form>
        )}

        {mode === "magic" && !magicSent && (
          <form onSubmit={submitMagic} className="space-y-4">
            <Field
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              autoComplete="email"
              required
            />
            {err && (
              <div className="text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-md px-3 py-2">
                {err}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[var(--sun)] text-[var(--deep)] font-black tracking-widest text-xs uppercase disabled:opacity-50 hover:opacity-90 transition shadow-[0_10px_30px_-10px_rgba(245,221,90,0.8)]"
            >
              {loading ? "Se trimite…" : "Trimite link"}
            </button>
            <BackButton onClick={() => setMode("oauth")} />
          </form>
        )}

        {mode === "magic" && magicSent && (
          <div className="space-y-3 py-1">
            <div className="text-sm">
              Ți-am trimis un link de conectare pe <strong>{email}</strong>.
            </div>
            <div className="text-xs opacity-60">Verifică inbox-ul (și spam-ul).</div>
          </div>
        )}

        <footer className="pt-2 border-t border-white/10 flex items-center justify-between text-[0.6rem] uppercase tracking-[0.3em] font-bold opacity-55">
          <span>Mișcă-te · Trăiește · Evoluează</span>
          <Link href="/privacy" className="hover:opacity-100 transition">
            Confidențialitate
          </Link>
        </footer>
      </div>
    </div>
  );
}

function Field({
  label,
  type,
  value,
  onChange,
  autoComplete,
  required,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <label className="block space-y-2">
      <span className="block text-[0.65rem] uppercase tracking-[0.3em] font-bold opacity-60">
        {label}
      </span>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        className="w-full rounded-xl outline-none text-sm transition"
        style={{
          height: "48px",
          padding: "0 1rem",
          background: "rgba(0,0,0,0.45)",
          border: "1px solid rgba(255,255,255,0.18)",
          color: "var(--w)",
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "var(--sun)";
          e.currentTarget.style.background = "rgba(0,0,0,0.65)";
          e.currentTarget.style.boxShadow = "0 0 0 3px rgba(245,221,90,0.12)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)";
          e.currentTarget.style.background = "rgba(0,0,0,0.45)";
          e.currentTarget.style.boxShadow = "none";
        }}
      />
    </label>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-[0.6rem] uppercase tracking-[0.3em] font-bold opacity-45 hover:opacity-90 transition pt-1"
    >
      ← Altă metodă
    </button>
  );
}

export default function LoginPage() {
  return (
    <div className="login-shell relative min-h-screen w-full overflow-hidden flex items-center justify-center p-6">
      <StarfieldBg />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_-10%,rgba(245,221,90,0.18),transparent_60%)]" />
      <div className="relative z-10 w-full flex items-center justify-center">
        <Suspense fallback={<div className="opacity-60 text-sm">…</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
