"use client";
import { useSyncExternalStore } from "react";
import Link from "next/link";
import { useLang } from "@/lib/lang-context";

const KEY = "mueve-cookie-consent";

function subscribe(cb: () => void): () => void {
  window.addEventListener("storage", cb);
  return () => window.removeEventListener("storage", cb);
}
function getSnapshot(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}
function getServerSnapshot(): string | null {
  return "ssr"; // treat as "consent given" on server to avoid flash
}

export default function CookieBanner() {
  const { lang } = useLang();
  const consent = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  if (consent) return null;

  const accept = () => {
    try {
      localStorage.setItem(KEY, "accepted");
      window.dispatchEvent(new StorageEvent("storage", { key: KEY, newValue: "accepted" }));
    } catch {}
  };

  return (
    <div
      role="dialog"
      aria-live="polite"
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:max-w-sm z-50 bg-[rgba(10,14,30,0.55)] backdrop-blur-3xl backdrop-saturate-200 border border-white/20 rounded-2xl p-5 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)] ring-1 ring-inset ring-white/10 text-sm space-y-3"
    >
      <div className="font-black uppercase tracking-widest text-xs text-[var(--sun)]">
        {lang === "ro" ? "Cookie-uri" : "Cookies"}
      </div>
      <div className="opacity-85 leading-relaxed">
        {lang === "ro"
          ? "Folosim doar cookie-uri esențiale (sesiune login, limbă). Fără tracking terț."
          : "We only use essential cookies (login session, language). No third-party tracking."}{" "}
        <Link href="/privacy" className="text-[var(--sun)] hover:opacity-80">
          {lang === "ro" ? "Detalii" : "Details"}
        </Link>
      </div>
      <button
        onClick={accept}
        className="w-full py-2.5 rounded-md bg-[var(--sun)] text-[var(--deep)] font-black uppercase tracking-widest text-xs hover:opacity-90 transition"
      >
        {lang === "ro" ? "Am înțeles" : "Got it"}
      </button>
    </div>
  );
}
