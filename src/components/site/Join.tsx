"use client";
import { useLang } from "@/lib/lang-context";
import { pick } from "@/lib/bilingual";
import type { JoinData } from "@/lib/content-types";

export default function Join({ data }: { data: JoinData }) {
  const { lang } = useLang();
  return (
    <section className="join" id="join">
      <h2>
        {pick(data.heading.lead, lang)}
        <em>{pick(data.heading.accent, lang)}</em>
      </h2>
      <p>{pick(data.body, lang)}</p>
      <div className="join-form">
        <a href="/login?from=/dashboard" className="join-cta">
          {lang === "ro" ? "Intră în cont" : "Sign in"}
        </a>
      </div>
    </section>
  );
}
