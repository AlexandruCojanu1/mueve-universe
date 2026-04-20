"use client";
import { createContext, useContext, useEffect, useState } from "react";
import type { Lang } from "./content-types";

type Ctx = { lang: Lang; setLang: (l: Lang) => void; toggle: () => void };
const LangCtx = createContext<Ctx | null>(null);

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ro");

  useEffect(() => {
    const stored = typeof window !== "undefined" ? (localStorage.getItem("mueve-lang") as Lang | null) : null;
    if (stored === "ro" || stored === "en") setLangState(stored);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem("mueve-lang", l);
    } catch {}
  };
  const toggle = () => setLang(lang === "ro" ? "en" : "ro");

  return <LangCtx.Provider value={{ lang, setLang, toggle }}>{children}</LangCtx.Provider>;
}

export function useLang(): Ctx {
  const ctx = useContext(LangCtx);
  if (!ctx) throw new Error("useLang must be used inside LangProvider");
  return ctx;
}
