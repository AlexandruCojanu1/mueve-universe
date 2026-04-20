// Section type registry: defines the shape of each block type's `data` JSON.
// Admin editors derive fields from these types.

export type Lang = "ro" | "en";
export type Bilingual = { ro: string; en: string };

export type NavLink = { label: Bilingual; href: string };
export type NavData = {
  logo: string;
  links: NavLink[];
  ctaLabel?: Bilingual;
};

export type HeroData = {
  headingTop: Bilingual;
  headingAccent: Bilingual;
  headingBottom: Bilingual;
  sub: Bilingual;
  scrollLabel: Bilingual;
};

export type WorldCard = {
  id: string;
  key: "forge" | "temple" | "path" | "sanctuary";
  label: Bilingual;
  title: Bilingual;
  body: Bilingual;
  tags: Bilingual[];
  bigIcon: string;
};

export type WorldsData = {
  heading: { lead: Bilingual; accent: Bilingual };
  intro: Bilingual;
  worlds: WorldCard[];
};

export type ProgramSlot = {
  id: string;
  day: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0=Mon..6=Sun
  row: "am" | "pm";
  activity: Bilingual;
  time: string;
  world: Bilingual;
  color: "yellow" | "purple" | "blue" | "orange";
  boss?: boolean;
  description?: Bilingual;
};

export type ProgramData = {
  heading: { lead: Bilingual; accent: Bilingual };
  intro: Bilingual;
  dayLabels: Bilingual[]; // length 7
  rowLabels: { am: Bilingual; pm: Bilingual };
  joinLabel: Bilingual;
  slots: ProgramSlot[];
};

export type PricingPlan = {
  id: string;
  name: Bilingual;
  price: string;
  originalPrice?: string;
  currency: Bilingual;
  period?: Bilingual;
  tagline?: Bilingual;
  featuresTitle?: Bilingual;
  features: Bilingual[];
  highlighted?: boolean;
  badge?: Bilingual;
  ctaLabel?: Bilingual;
  ctaHref?: string;
  stripePriceId?: string;
  checkoutMode?: "subscription" | "payment";
};

export type PricingTier = {
  id: string;
  title: Bilingual;
  subtitle?: Bilingual;
  plans: PricingPlan[];
  featured?: boolean;
};

export type PricingData = {
  heading: { lead: Bilingual; accent: Bilingual };
  intro: Bilingual;
  tiers: PricingTier[];
  note?: Bilingual;
};

export type StatItem = {
  id: string;
  value: Bilingual;
  label: Bilingual;
};

export type StatsData = {
  eyebrow?: Bilingual;
  heading?: Bilingual;
  items: StatItem[];
};

export type MissionValue = { id: string; title: Bilingual; body: Bilingual };
export type MissionData = {
  heading: { lead: Bilingual; accent: Bilingual };
  intro: Bilingual;
  values: MissionValue[];
};

export type JoinData = {
  heading: { lead: Bilingual; accent: Bilingual };
  body: Bilingual;
  emailPlaceholder: Bilingual;
  submitLabel: Bilingual;
};

export type FooterSocial = { id: string; label: string; href: string; icon: "instagram" | "tiktok" | "facebook" | "youtube" | "twitter" };
export type FooterData = {
  copyright: Bilingual;
  socials: FooterSocial[];
};

export type TextData = {
  heading?: Bilingual;
  body: Bilingual;
  align: "left" | "center" | "right";
};

export type CtaData = {
  label: Bilingual;
  href: string;
  variant: "primary" | "secondary";
};

export type ImageData = {
  src: string;
  alt: string;
  caption?: Bilingual;
};

export type SectionType =
  | "nav"
  | "hero"
  | "worlds"
  | "program"
  | "pricing"
  | "mission"
  | "stats"
  | "join"
  | "footer"
  | "text"
  | "cta"
  | "image";

export const SECTION_TYPE_LABELS: Record<SectionType, string> = {
  nav: "Navigation",
  hero: "Hero",
  worlds: "Worlds (4-card group)",
  program: "Weekly Program Grid",
  pricing: "Pricing / Plans",
  mission: "Mission",
  stats: "Stats / Metrics",
  join: "Join / Signup",
  footer: "Footer",
  text: "Text Block",
  cta: "CTA Button",
  image: "Image",
};

export const ADDABLE_SECTION_TYPES: SectionType[] = [
  "hero",
  "worlds",
  "program",
  "pricing",
  "mission",
  "stats",
  "join",
  "text",
  "cta",
  "image",
];

export const DEFAULT_COLORS = {
  deep: "#050816",
  mid: "#0A0F2A",
  light: "#11183C",
  sun: "#F5F50A",
  white: "#F5F5F5",
  black: "#000000",
  forge: "#3B82F6",
  temple: "#A855F7",
  path: "#06B6D4",
  sanctuary: "#F59E0B",
};

export const DEFAULT_FONTS = {
  heading: "Outfit",
  body: "Space Grotesk",
};
