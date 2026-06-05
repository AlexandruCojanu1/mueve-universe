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
    <div role="dialog" aria-live="polite" className="ck-banner">
      <div className="ck-body">
        <span className="ck-eyebrow">{lang === "ro" ? "Cookie-uri" : "Cookies"}</span>
        {lang === "ro"
          ? "Folosim doar cookie-uri esențiale (sesiune login, limbă). Fără tracking terț."
          : "We only use essential cookies (login session, language). No third-party tracking."}{" "}
        <Link href="/privacy" className="ck-link">
          {lang === "ro" ? "Detalii" : "Details"}
        </Link>
      </div>
      <button onClick={accept} className="ck-accept">
        {lang === "ro" ? "Am înțeles" : "Got it"}
      </button>
    </div>
  );
}
