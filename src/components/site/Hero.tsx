"use client";
import { useLang } from "@/lib/lang-context";
import { pick } from "@/lib/bilingual";
import type { HeroData } from "@/lib/content-types";
import SunCanvas from "./SunCanvas";

export default function Hero({ data }: { data: HeroData }) {
  const { lang } = useLang();
  return (
    <section className="hero" id="hero">
      <div className="hero-sun-wrap">
        <SunCanvas />
      </div>
      <h1>
        {pick(data.headingTop, lang)}
        <em>{pick(data.headingAccent, lang)}</em>
        {pick(data.headingBottom, lang)}
      </h1>
      <p className="hero-sub">{pick(data.sub, lang)}</p>
    </section>
  );
}
