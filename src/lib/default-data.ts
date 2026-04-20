import type {
  HeroData,
  WorldsData,
  ProgramData,
  MissionData,
  JoinData,
  FooterData,
  NavData,
  TextData,
  CtaData,
  ImageData,
  SectionType,
} from "./content-types";

const empty = { ro: "", en: "" };

export function defaultDataForType(type: SectionType): Record<string, unknown> {
  switch (type) {
    case "nav":
      return {
        logo: "MUEVE",
        links: [
          { label: { ro: "Lumi", en: "Worlds" }, href: "#worlds" },
          { label: { ro: "Program", en: "Program" }, href: "#prog" },
          { label: { ro: "Misiune", en: "Mission" }, href: "#mission" },
          { label: { ro: "Intră", en: "Join" }, href: "#join" },
        ],
      } satisfies NavData as unknown as Record<string, unknown>;
    case "hero":
      return {
        headingTop: { ro: "INTRĂ", en: "ENTER" },
        headingAccent: { ro: "ÎN UNIVERSUL", en: "THE UNIVERSE" },
        headingBottom: { ro: "MIȘCĂRII", en: "OF MOVEMENT" },
        sub: empty,
        scrollLabel: { ro: "Derulează", en: "Scroll" },
      } satisfies HeroData as unknown as Record<string, unknown>;
    case "worlds":
      return {
        heading: { lead: { ro: "PATRU LUMI.", en: "FOUR WORLDS." }, accent: { ro: "UN UNIVERS.", en: "ONE UNIVERSE." } },
        intro: empty,
        worlds: [],
      } satisfies WorldsData as unknown as Record<string, unknown>;
    case "program":
      return {
        heading: { lead: { ro: "HARTA", en: "WEEKLY" }, accent: { ro: "RITUALULUI", en: "RITUAL MAP" } },
        intro: empty,
        dayLabels: [
          { ro: "LUN", en: "MON" },
          { ro: "MAR", en: "TUE" },
          { ro: "MIE", en: "WED" },
          { ro: "JOI", en: "THU" },
          { ro: "VIN", en: "FRI" },
          { ro: "SÂM", en: "SAT" },
          { ro: "DUM", en: "SUN" },
        ],
        rowLabels: {
          am: { ro: "DIMINEAȚĂ", en: "MORNING" },
          noon: { ro: "PRÂNZ", en: "MIDDAY" },
          pm: { ro: "SEARA", en: "EVENING" },
        },
        joinLabel: { ro: "INTRĂ ÎN MISIUNE", en: "JOIN MISSION" },
        slots: [],
      } satisfies ProgramData as unknown as Record<string, unknown>;
    case "mission":
      return {
        heading: { lead: { ro: "", en: "OUR" }, accent: { ro: "MISIUNEA", en: "MISSION" } },
        intro: empty,
        values: [],
      } satisfies MissionData as unknown as Record<string, unknown>;
    case "join":
      return {
        heading: { lead: { ro: "GATA", en: "READY" }, accent: { ro: "SĂ INTRI?", en: "TO ENTER?" } },
        body: empty,
        emailPlaceholder: { ro: "email@exemplu.com", en: "email@example.com" },
        submitLabel: { ro: "LANSEAZĂ", en: "LAUNCH" },
      } satisfies JoinData as unknown as Record<string, unknown>;
    case "footer":
      return {
        copyright: { ro: "© 2026 MUEVE", en: "© 2026 MUEVE" },
        socials: [],
      } satisfies FooterData as unknown as Record<string, unknown>;
    case "text":
      return { heading: empty, body: empty, align: "left" } satisfies TextData as unknown as Record<string, unknown>;
    case "cta":
      return { label: { ro: "Acțiune", en: "Action" }, href: "#", variant: "primary" } satisfies CtaData as unknown as Record<string, unknown>;
    case "image":
      return { src: "", alt: "", caption: empty } satisfies ImageData as unknown as Record<string, unknown>;
  }
}
