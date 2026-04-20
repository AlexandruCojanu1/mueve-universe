"use client";
import { createContext, useContext, useState } from "react";
import type { Lang } from "./content-types";

type Ctx = { lang: Lang; setLang: (l: Lang) => void; toggle: () => void };
const LangCtx = createContext<Ctx | null>(null);

function readInitialLang(): Lang {
  if (typeof window === "undefined") return "ro";
  try {
    const stored = localStorage.getItem("mueve-lang");
    if (stored === "ro" || stored === "en") return stored;
  } catch {}
  return "ro";
}

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readInitialLang);

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
