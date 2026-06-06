import type { Section } from "@/db/schema";
import { LangProvider } from "@/lib/lang-context";
import SectionRenderer from "./SectionRenderer";
import SkyScene from "./SkyScene";
import Cursor from "./Cursor";
import LenisScroll from "./LenisScroll";
import CookieBanner from "./CookieBanner";
import LaunchOverlay from "./LaunchOverlay";

type LaunchState = {
  state: "pre" | "countdown" | "live";
  startAt?: string;
  gate?: boolean;
  winners?: {
    girl: { name: string | null } | null;
    boy: { name: string | null } | null;
    shownAt?: string;
  } | null;
  v?: number;
};

export default function SiteShell({
  sections,
  launch,
}: {
  sections: Section[];
  launch?: LaunchState;
}) {
  return (
    <LangProvider>
      {/* Always mounted: live-syncs launch state + content edits to open phones. */}
      <LaunchOverlay initial={launch ?? { state: "live" }} />
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
