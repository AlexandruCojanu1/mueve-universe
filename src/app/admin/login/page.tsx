"use client";
import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const from = sp.get("from") || "/admin";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
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

  return (
    <form
      onSubmit={submit}
      className="w-full max-w-sm bg-black/40 border border-white/10 rounded-xl p-8 backdrop-blur space-y-5"
    >
      <div>
        <h1 className="text-2xl font-black tracking-tight">MUEVE Admin</h1>
        <p className="text-xs opacity-60 mt-1">Autentificare editor</p>
      </div>
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
    </form>
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
