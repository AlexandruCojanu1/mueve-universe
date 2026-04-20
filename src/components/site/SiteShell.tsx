import type { Section } from "@/db/schema";
import { LangProvider } from "@/lib/lang-context";
import SectionRenderer from "./SectionRenderer";
import SkyScene from "./SkyScene";
import Cursor from "./Cursor";
import LenisScroll from "./LenisScroll";
import CookieBanner from "./CookieBanner";

export default function SiteShell({ sections }: { sections: Section[] }) {
  return (
    <LangProvider>
      <LenisScroll />
      <SkyScene />
      <Cursor />
      {sections.map((s) => (
        <SectionRenderer key={s.id} section={s} />
      ))}
      <CookieBanner />
    </LangProvider>
  );
}
