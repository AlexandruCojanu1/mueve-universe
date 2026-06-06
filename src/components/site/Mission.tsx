"use client";
import { useLang } from "@/lib/lang-context";
import { pick, soonLabel } from "@/lib/bilingual";
import type { MissionData } from "@/lib/content-types";

export default function Mission({ data }: { data: MissionData }) {
  const { lang } = useLang();
  const lead = pick(data.heading.lead, lang);
  const accent = pick(data.heading.accent, lang);
  const teaser = !!data.teaser;
  return (
    <section className="mission" id="mission">
      <div className="mission-left">
        <h2>
          {lead ? (
            <>
              {lead}
              <br />
            </>
          ) : null}
          <span>{accent}</span>
        </h2>
        <p className={teaser ? "teaser-blur" : undefined}>
          {pick(data.intro, lang)}
        </p>
      </div>
      <div className={"mission-right" + (teaser ? " teaser-wrap" : "")}>
        {data.values.map((v) => (
          <div key={v.id} className={"m-val" + (teaser ? " teaser-blur" : "")}>
            <h4>{pick(v.title, lang)}</h4>
            <p>{pick(v.body, lang)}</p>
          </div>
        ))}
        {teaser && (
          <span className="teaser-pill teaser-pill-lg">{soonLabel(lang)}</span>
        )}
      </div>
    </section>
  );
}
