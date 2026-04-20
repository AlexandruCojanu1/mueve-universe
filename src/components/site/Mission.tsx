"use client";
import { useLang } from "@/lib/lang-context";
import { pick } from "@/lib/bilingual";
import type { MissionData } from "@/lib/content-types";

export default function Mission({ data }: { data: MissionData }) {
  const { lang } = useLang();
  const lead = pick(data.heading.lead, lang);
  const accent = pick(data.heading.accent, lang);
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
        <p>{pick(data.intro, lang)}</p>
      </div>
      <div className="mission-right">
        {data.values.map((v) => (
          <div key={v.id} className="m-val">
            <h4>{pick(v.title, lang)}</h4>
            <p>{pick(v.body, lang)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
