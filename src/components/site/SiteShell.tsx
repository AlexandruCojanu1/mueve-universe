import type { Section } from "@/db/schema";
import { LangProvider } from "@/lib/lang-context";
import SectionRenderer from "./SectionRenderer";
import SkyScene from "./SkyScene";
import Cursor from "./Cursor";
import LenisScroll from "./LenisScroll";
import CookieBanner from "./CookieBanner";
import LaunchOverlay from "./LaunchOverlay";

type LaunchState = { state: "pre" | "countdown" | "live"; startAt?: string };

export default function SiteShell({
  sections,
  launch,
}: {
  sections: Section[];
  launch?: LaunchState;
}) {
  return (
    <LangProvider>
      {launch && launch.state !== "live" && <LaunchOverlay initial={launch} />}
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
