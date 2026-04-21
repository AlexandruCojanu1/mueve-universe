"use client";
import { Suspense, useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import StarfieldBg from "@/components/site/StarfieldBg";

const BENEFITS = [
  { tag: "01", title: "Toate lumile", desc: "Calisthenics, yoga, alergare, team sports." },
  { tag: "02", title: "Wallet cosmic", desc: "Prezențe, sesiuni și abonament într-un singur loc." },
  { tag: "03", title: "Comunitate reală", desc: "Antrenori, evenimente, oameni care se mișcă." },
];

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

  const showBenefits = mode === "oauth";

  return (
    <div className="login-card relative w-full max-w-[560px] mx-auto">
      <div className="pointer-events-none absolute -inset-12 rounded-[36px] bg-[radial-gradient(closest-side,rgba(245,221,90,0.28),transparent_70%)] blur-3xl" />

      <div
        className="relative rounded-[28px] p-8 sm:p-10 md:p-12 space-y-10"
        style={{
          background: "rgba(10,14,30,0.58)",
          backdropFilter: "blur(36px) saturate(200%)",
          WebkitBackdropFilter: "blur(36px) saturate(200%)",
          border: "1px solid rgba(255,255,255,0.14)",
          boxShadow:
            "0 40px 100px -20px rgba(0,0,0,0.75), inset 0 1px 0 0 rgba(255,255,255,0.08)",
        }}
      >
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[0.62rem] uppercase tracking-[0.35em] font-bold opacity-55 hover:opacity-100 transition"
          >
            <span aria-hidden>←</span>
            Acasă
          </Link>
          <div
            aria-hidden
            className="h-10 w-10 rounded-full flex items-center justify-center"
            style={{
              background:
                "radial-gradient(circle at 35% 30%, #FFF3A8 0%, #F5DD5A 45%, #C99818 100%)",
              boxShadow:
                "0 0 0 1px rgba(245,221,90,0.4), 0 0 30px 4px rgba(245,221,90,0.45)",
            }}
          />
        </div>

        <header className="space-y-4">
          <div className="text-[0.62rem] uppercase tracking-[0.35em] font-bold text-[var(--sun)] opacity-90">
            Autentificare
          </div>
          <h1
            className="font-black tracking-tight leading-[0.95]"
            style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(2.2rem, 4.2vw, 3rem)" }}
          >
            Bine ai revenit în{" "}
            <span className="text-[var(--sun)]">universul mișcării</span>.
          </h1>
          <p className="text-sm md:text-[0.95rem] opacity-75 leading-relaxed max-w-[90%]">
            Intră pe cont și continuă din locul în care te-ai oprit — sesiuni,
            wallet, comunitate. Totul într-un singur loc.
          </p>
        </header>

        {showBenefits && (
          <ul className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {BENEFITS.map((b) => (
              <li
                key={b.tag}
                className="rounded-2xl p-4 space-y-2"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <div className="text-[0.6rem] uppercase tracking-[0.3em] font-black text-[var(--sun)]">
                  {b.tag}
                </div>
                <div className="text-sm font-black tracking-tight">{b.title}</div>
                <div className="text-xs opacity-65 leading-relaxed">{b.desc}</div>
              </li>
            ))}
          </ul>
        )}

        <div className="space-y-4">
          {mode === "oauth" && (
            <>
              {hasGoogle && (
                <button
                  onClick={() => signIn("google", { callbackUrl: from })}
                  className="w-full py-3.5 rounded-xl border border-white/20 hover:border-white/45 hover:bg-white/5 text-sm font-bold tracking-wide transition"
                >
                  Continuă cu Google
                </button>
              )}
              {hasApple && (
                <button
                  onClick={() => signIn("apple", { callbackUrl: from })}
                  className="w-full py-3.5 rounded-xl border border-white/20 hover:border-white/45 hover:bg-white/5 text-sm font-bold tracking-wide transition"
                >
                  Continuă cu Apple
                </button>
              )}
              {hasEmail && (
                <button
                  onClick={() => setMode("magic")}
                  className="w-full py-3.5 rounded-xl border border-white/15 hover:border-white/35 hover:bg-white/5 text-sm font-bold tracking-wide transition"
                >
                  Continuă cu email (magic link)
                </button>
              )}

              <button
                onClick={() => setMode("password")}
                className="w-full py-4 rounded-xl font-black uppercase tracking-[0.22em] text-xs transition"
                style={{
                  background: "var(--sun)",
                  color: "var(--deep)",
                  boxShadow: "0 18px 40px -12px rgba(245,221,90,0.65)",
                }}
              >
                Intră cu email și parolă
              </button>

              {!hasGoogle && !hasApple && !hasEmail && (
                <p className="text-[0.62rem] uppercase tracking-[0.25em] opacity-45 text-center pt-1">
                  OAuth și magic link se activează în curând.
                </p>
              )}
            </>
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
                <div
                  className="text-xs rounded-lg px-3 py-2.5"
                  style={{
                    color: "#FCA5A5",
                    background: "rgba(239,68,68,0.08)",
                    border: "1px solid rgba(239,68,68,0.35)",
                  }}
                >
                  {err}
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-xl font-black uppercase tracking-[0.22em] text-xs transition disabled:opacity-50"
                style={{
                  background: "var(--sun)",
                  color: "var(--deep)",
                  boxShadow: "0 18px 40px -12px rgba(245,221,90,0.65)",
                }}
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
                <div
                  className="text-xs rounded-lg px-3 py-2.5"
                  style={{
                    color: "#FCA5A5",
                    background: "rgba(239,68,68,0.08)",
                    border: "1px solid rgba(239,68,68,0.35)",
                  }}
                >
                  {err}
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-xl font-black uppercase tracking-[0.22em] text-xs transition disabled:opacity-50"
                style={{
                  background: "var(--sun)",
                  color: "var(--deep)",
                  boxShadow: "0 18px 40px -12px rgba(245,221,90,0.65)",
                }}
              >
                {loading ? "Se trimite…" : "Trimite link"}
              </button>
              <BackButton onClick={() => setMode("oauth")} />
            </form>
          )}

          {mode === "magic" && magicSent && (
            <div
              className="rounded-xl p-5 space-y-2"
              style={{
                background: "rgba(245,221,90,0.08)",
                border: "1px solid rgba(245,221,90,0.35)",
              }}
            >
              <div className="text-sm font-bold">Email trimis.</div>
              <div className="text-xs opacity-75 leading-relaxed">
                Verifică inbox-ul <strong>{email}</strong> (și folderul de spam).
                Linkul e valabil 15 minute.
              </div>
            </div>
          )}
        </div>

        <footer className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-6 border-t border-white/10">
          <div className="text-[0.6rem] uppercase tracking-[0.3em] font-bold opacity-55">
            Mișcă-te · Trăiește · Evoluează
          </div>
          <div className="flex items-center gap-5 text-[0.6rem] uppercase tracking-[0.3em] font-bold opacity-55">
            <Link href="/privacy" className="hover:opacity-100 transition">
              Confidențialitate
            </Link>
            <Link href="/terms" className="hover:opacity-100 transition">
              Termeni
            </Link>
          </div>
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
      <span className="block text-[0.62rem] uppercase tracking-[0.3em] font-bold opacity-60">
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
          height: "52px",
          padding: "0 1rem",
          background: "rgba(0,0,0,0.42)",
          border: "1px solid rgba(255,255,255,0.18)",
          color: "var(--w)",
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "var(--sun)";
          e.currentTarget.style.background = "rgba(0,0,0,0.65)";
          e.currentTarget.style.boxShadow = "0 0 0 3px rgba(245,221,90,0.14)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)";
          e.currentTarget.style.background = "rgba(0,0,0,0.42)";
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
    <div className="login-shell relative min-h-screen w-full overflow-hidden flex items-center justify-center px-5 py-12">
      <StarfieldBg />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_-10%,rgba(245,221,90,0.22),transparent_65%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_120%,rgba(120,60,200,0.18),transparent_60%)]" />
      <div className="relative z-10 w-full flex items-center justify-center">
        <Suspense fallback={<div className="opacity-60 text-sm">…</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
