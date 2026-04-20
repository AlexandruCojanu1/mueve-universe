import type { Bilingual, Lang } from "./content-types";

export function pick(b: Bilingual | undefined, lang: Lang): string {
  if (!b) return "";
  const v = b[lang];
  if (typeof v === "string") return v;
  const other = lang === "ro" ? b.en : b.ro;
  return typeof other === "string" ? other : "";
}
