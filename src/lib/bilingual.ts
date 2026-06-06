import type { Bilingual, Lang } from "./content-types";

export function pick(b: Bilingual | undefined, lang: Lang): string {
  if (!b) return "";
  const v = b[lang];
  if (typeof v === "string") return v;
  const other = lang === "ro" ? b.en : b.ro;
  return typeof other === "string" ? other : "";
}

/**
 * Teaser convention: "visible prefix||blurred remainder".
 * Returns the readable prefix and the part to render blurred (empty if none).
 */
export function splitTeaser(s: string): { prefix: string; blur: string } {
  const i = s.indexOf("||");
  if (i === -1) return { prefix: s, blur: "" };
  return { prefix: s.slice(0, i), blur: s.slice(i + 2) };
}

/** Bilingual teaser pill label. */
export function soonLabel(lang: Lang): string {
  return lang === "ro" ? "În curând" : "Coming soon";
}
