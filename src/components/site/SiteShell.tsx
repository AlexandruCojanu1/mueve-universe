import type { Section } from "@/db/schema";
import { LangProvider } from "@/lib/lang-context";
import SectionRenderer from "./SectionRenderer";
import StarfieldBg from "./StarfieldBg";
import Cursor from "./Cursor";
import LenisScroll from "./LenisScroll";

export default function SiteShell({ sections }: { sections: Section[] }) {
  return (
    <LangProvider>
      <LenisScroll />
      <StarfieldBg />
      <Cursor />
      {sections.map((s) => (
        <SectionRenderer key={s.id} section={s} />
      ))}
    </LangProvider>
  );
}
