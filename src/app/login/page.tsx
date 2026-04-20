"use client";
import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

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
    <div className="w-full max-w-sm bg-black/40 border border-white/10 rounded-xl p-8 backdrop-blur space-y-5">
      <div>
        <h1 className="text-2xl font-black tracking-tight">MUEVE UNIVERSE</h1>
        <p className="text-xs opacity-60 mt-1">Intră în contul tău</p>
      </div>

      {mode === "oauth" && (
        <div className="space-y-3">
          {hasGoogle && (
            <button
              onClick={() => signIn("google", { callbackUrl: from })}
              className="w-full py-2.5 rounded-md border border-white/20 hover:border-white/50 text-sm font-bold tracking-wide transition"
            >
              Continuă cu Google
            </button>
          )}
          {hasApple && (
            <button
              onClick={() => signIn("apple", { callbackUrl: from })}
              className="w-full py-2.5 rounded-md border border-white/20 hover:border-white/50 text-sm font-bold tracking-wide transition"
            >
              Continuă cu Apple
            </button>
          )}
          {!hasGoogle && !hasApple && (
            <div className="text-xs opacity-60 py-2">
              Login OAuth neconfigurat încă. Folosește emailul sau parola.
            </div>
          )}
          {hasEmail && (
            <button
              onClick={() => setMode("magic")}
              className="w-full py-2.5 rounded-md border border-white/10 hover:border-white/30 text-xs uppercase tracking-widest opacity-70 hover:opacity-100 transition"
            >
              Continuă cu email (magic link)
            </button>
          )}
          <button
            onClick={() => setMode("password")}
            className="w-full py-2.5 rounded-md text-xs uppercase tracking-widest opacity-50 hover:opacity-90 transition"
          >
            Admin / Coach: cu parolă
          </button>
        </div>
      )}

      {mode === "password" && (
        <form onSubmit={submitPassword} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest opacity-60">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 rounded-md bg-black/50 border border-white/15 focus:border-[var(--sun)] outline-none text-sm"
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest opacity-60">Parolă</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 rounded-md bg-black/50 border border-white/15 focus:border-[var(--sun)] outline-none text-sm"
              autoComplete="current-password"
            />
          </div>
          {err && <div className="text-xs text-red-400">{err}</div>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-md bg-[var(--sun)] text-[var(--deep)] font-black tracking-widest text-xs uppercase disabled:opacity-50"
          >
            {loading ? "..." : "Intră"}
          </button>
          <button
            type="button"
            onClick={() => setMode("oauth")}
            className="w-full text-xs uppercase tracking-widest opacity-50 hover:opacity-90"
          >
            ← Înapoi
          </button>
        </form>
      )}

      {mode === "magic" && !magicSent && (
        <form onSubmit={submitMagic} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-widest opacity-60">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 rounded-md bg-black/50 border border-white/15 focus:border-[var(--sun)] outline-none text-sm"
              autoComplete="email"
            />
          </div>
          {err && <div className="text-xs text-red-400">{err}</div>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-md bg-[var(--sun)] text-[var(--deep)] font-black tracking-widest text-xs uppercase disabled:opacity-50"
          >
            {loading ? "..." : "Trimite link"}
          </button>
          <button
            type="button"
            onClick={() => setMode("oauth")}
            className="w-full text-xs uppercase tracking-widest opacity-50 hover:opacity-90"
          >
            ← Înapoi
          </button>
        </form>
      )}

      {mode === "magic" && magicSent && (
        <div className="space-y-3 py-2">
          <div className="text-sm">Ți-am trimis un link de conectare pe <strong>{email}</strong>.</div>
          <div className="text-xs opacity-60">Verifică inbox-ul (și spam-ul).</div>
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="admin-surface min-h-screen flex items-center justify-center p-6">
      <Suspense fallback={<div className="opacity-60">…</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
