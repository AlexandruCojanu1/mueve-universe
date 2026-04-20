"use client";
import { useLang } from "@/lib/lang-context";
import { pick } from "@/lib/bilingual";
import type { StatsData } from "@/lib/content-types";

export default function Stats({ data }: { data: StatsData }) {
  const { lang } = useLang();
  const eyebrow = data.eyebrow ? pick(data.eyebrow, lang) : "";
  const heading = data.heading ? pick(data.heading, lang) : "";
  return (
    <section className="stats" id="stats">
      {(eyebrow || heading) && (
        <div className="stats-head">
          {eyebrow && <div className="stats-eyebrow">{eyebrow}</div>}
          {heading && <h2>{heading}</h2>}
        </div>
      )}
      <div className="stats-grid">
        {data.items.map((s) => (
          <div key={s.id} className="stat-item">
            <div className="stat-value">{pick(s.value, lang)}</div>
            <div className="stat-label">{pick(s.label, lang)}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
