import type { Bilingual, Lang } from "./content-types";

export function pick(b: Bilingual | undefined, lang: Lang): string {
  if (!b) return "";
  return b[lang] || b.ro || b.en || "";
}
