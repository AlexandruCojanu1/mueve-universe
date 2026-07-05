"use client";
import { useLang } from "@/lib/lang-context";

/**
 * Account CTA shown under section titles. The "Classes" button was removed
 * for the PASS-only launch (class booking logic is inactive for now).
 */
export default function CtaPair({ center }: { center?: boolean }) {
  const { lang } = useLang();
  return (
    <div className={"cta-pair" + (center ? " cta-pair-center" : "")}>
      <a href="/dashboard" className="cta-pair-btn cta-pair-primary">
        {lang === "ro" ? "Cont" : "Account"}
      </a>
    </div>
  );
}
