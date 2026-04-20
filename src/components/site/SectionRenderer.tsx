"use client";
import type { Section } from "@/db/schema";
import type {
  NavData,
  HeroData,
  WorldsData,
  ProgramData,
  PricingData,
  MissionData,
  StatsData,
  JoinData,
  FooterData,
  TextData,
  CtaData,
  ImageData,
} from "@/lib/content-types";
import Nav from "./Nav";
import Hero from "./Hero";
import Worlds from "./Worlds";
import Program from "./Program";
import Pricing from "./Pricing";
import Mission from "./Mission";
import Stats from "./Stats";
import Join from "./Join";
import Footer from "./Footer";
import { TextBlock, CtaBlock, ImageBlock } from "./Generic";

export default function SectionRenderer({ section }: { section: Section }) {
  if (!section.visible) return null;
  const d = section.data as Record<string, unknown>;
  switch (section.type) {
    case "nav":
      return <Nav data={d as unknown as NavData} />;
    case "hero":
      return <Hero data={d as unknown as HeroData} />;
    case "worlds":
      return <Worlds data={d as unknown as WorldsData} />;
    case "program":
      return <Program data={d as unknown as ProgramData} />;
    case "pricing":
      return <Pricing data={d as unknown as PricingData} />;
    case "mission":
      return <Mission data={d as unknown as MissionData} />;
    case "stats":
      return <Stats data={d as unknown as StatsData} />;
    case "join":
      return <Join data={d as unknown as JoinData} />;
    case "footer":
      return <Footer data={d as unknown as FooterData} />;
    case "text":
      return <TextBlock data={d as unknown as TextData} />;
    case "cta":
      return <CtaBlock data={d as unknown as CtaData} />;
    case "image":
      return <ImageBlock data={d as unknown as ImageData} />;
    default:
      return null;
  }
}
