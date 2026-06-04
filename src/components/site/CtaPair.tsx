"use client";
import { useLang } from "@/lib/lang-context";

/** Pair of CTA buttons (account + classes) shown under section titles. */
export default function CtaPair({ center }: { center?: boolean }) {
  const { lang } = useLang();
  return (
    <div className={"cta-pair" + (center ? " cta-pair-center" : "")}>
      <a href="/dashboard" className="cta-pair-btn cta-pair-primary">
        {lang === "ro" ? "Cont" : "Account"}
      </a>
      <a href="/dashboard/sessions" className="cta-pair-btn cta-pair-ghost">
        {lang === "ro" ? "Clase" : "Classes"}
      </a>
    </div>
  );
}
