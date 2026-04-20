"use client";
import { useLang } from "@/lib/lang-context";
import { pick } from "@/lib/bilingual";
import type { TextData, CtaData, ImageData } from "@/lib/content-types";

export function TextBlock({ data }: { data: TextData }) {
  const { lang } = useLang();
  return (
    <section className={`text-block align-${data.align}`}>
      {data.heading && <h2>{pick(data.heading, lang)}</h2>}
      <p style={{ whiteSpace: "pre-wrap" }}>{pick(data.body, lang)}</p>
    </section>
  );
}

export function CtaBlock({ data }: { data: CtaData }) {
  const { lang } = useLang();
  return (
    <section className="cta-block">
      <a href={data.href} className={data.variant}>
        {pick(data.label, lang)}
      </a>
    </section>
  );
}

export function ImageBlock({ data }: { data: ImageData }) {
  const { lang } = useLang();
  return (
    <figure className="image-block">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={data.src} alt={data.alt} />
      {data.caption && <figcaption>{pick(data.caption, lang)}</figcaption>}
    </figure>
  );
}
