import { db } from "./index";
import { theme, sections, users } from "./schema";
import { hashPassword } from "../lib/passwords";
import {
  DEFAULT_COLORS,
  DEFAULT_FONTS,
  type HeroData,
  type WorldsData,
  type ProgramData,
  type PricingData,
  type MissionData,
  type StatsData,
  type JoinData,
  type FooterData,
  type NavData,
} from "../lib/content-types";

const bi = (ro: string, en: string) => ({ ro, en });

async function main() {
  if (process.env.NODE_ENV === "production" && process.env.FORCE_SEED !== "1") {
    console.error(
      "seed refused: NODE_ENV=production and FORCE_SEED!=1. This script WIPES users/sections/theme.",
    );
    process.exit(1);
  }

  const email = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const pw = process.env.ADMIN_PASSWORD || "";
  if (!email || !pw) {
    console.error("seed refused: ADMIN_EMAIL and ADMIN_PASSWORD must be set.");
    process.exit(1);
  }
  if (pw.length < 12) {
    console.error("seed refused: ADMIN_PASSWORD must be at least 12 characters.");
    process.exit(1);
  }

  console.log("seeding...");

  // Wipe
  await db.delete(sections);
  await db.delete(theme);
  await db.delete(users);

  // Theme
  await db.insert(theme).values({
    id: "default",
    colors: DEFAULT_COLORS,
    fonts: DEFAULT_FONTS,
  });

  // Admin user
  const hash = await hashPassword(pw);
  await db.insert(users).values({
    email,
    passwordHash: hash,
    name: "MUEVE UNIVERSE Admin",
    role: "admin",
  });
  console.log(`  admin user: ${email}`);

  // ── Sections, in display order ──
  let order = 0;
  const add = (type: string, data: Record<string, unknown>, visible = true) =>
    db.insert(sections).values({ type, order: order++, visible, data });

  // NAV
  const nav: NavData = {
    logo: "MUEVE UNIVERSE",
    links: [
      { label: bi("Lumi", "Worlds"), href: "#worlds" },
      { label: bi("Program", "Program"), href: "#prog" },
      { label: bi("Misiune", "Mission"), href: "#mission" },
      { label: bi("Intră", "Join"), href: "#join" },
    ],
  };
  await add("nav", nav);

  // HERO
  const hero: HeroData = {
    headingTop: bi("INTRĂ", "ENTER"),
    headingAccent: bi("ÎN UNIVERSUL", "THE UNIVERSE"),
    headingBottom: bi("MIȘCĂRII", "OF MOVEMENT"),
    sub: bi(
      "Calisthenics. Yoga. Alergare. Comunitate. Un ecosistem viu. Ritualul tău zilnic.",
      "Calisthenics. Yoga. Running. Community. One living ecosystem. Your daily ritual.",
    ),
    scrollLabel: bi("Derulează", "Scroll"),
  };
  await add("hero", hero);

  // PROGRAM
  const program: ProgramData = {
    heading: { lead: bi("HARTA", "WEEKLY"), accent: bi("RITUALULUI", "RITUAL MAP") },
    intro: bi(
      "7 zile. 7 misiuni. Un ciclu care te transformă. Click pe o zi pentru detalii.",
      "7 days. 7 missions. One cycle that transforms you. Click a day to see the mission.",
    ),
    dayLabels: [
      bi("LUN", "MON"),
      bi("MAR", "TUE"),
      bi("MIE", "WED"),
      bi("JOI", "THU"),
      bi("VIN", "FRI"),
      bi("SÂM", "SAT"),
      bi("DUM", "SUN"),
    ],
    rowLabels: {
      am: bi("DIMINEAȚĂ", "MORNING"),
      pm: bi("SEARA", "EVENING"),
    },
    joinLabel: bi("INTRĂ ÎN MISIUNE", "JOIN MISSION"),
    slots: [
      // MON — SUNRISE MOVEMENT FOR ALL
      { id: "am-0", day: 0, row: "am", activity: bi("Sunrise Movement for All", "Sunrise Movement for All"), time: "06:30", world: bi("Toate Lumile", "All Worlds"), color: "yellow" },
      // TUE — SUNSET SOCIAL RUN
      { id: "pm-1", day: 1, row: "pm", activity: bi("Sunset Social Run", "Sunset Social Run"), time: "19:30", world: bi("Drumul", "Path"), color: "purple" },
      // WED — SUNRISE YOGA
      { id: "am-2", day: 2, row: "am", activity: bi("Sunrise Yoga", "Sunrise Yoga"), time: "06:30", world: bi("Templul", "Temple"), color: "purple" },
      // THU — SUNRISE CALISTHENICS
      { id: "am-3", day: 3, row: "am", activity: bi("Sunrise Calisthenics", "Sunrise Calisthenics"), time: "06:30", world: bi("Forja", "Forge"), color: "blue" },
      // FRI — COMING SOON
      { id: "am-4", day: 4, row: "am", activity: bi("Coming Soon", "Coming Soon"), time: "TBA", world: bi("", ""), color: "orange" },
      // SAT — COMING SOON
      { id: "am-5", day: 5, row: "am", activity: bi("Coming Soon", "Coming Soon"), time: "TBA", world: bi("", ""), color: "orange" },
      // SUN — THE BIG SOCIAL RUN (main event)
      { id: "am-6", day: 6, row: "am", activity: bi("THE BIG Social Run", "THE BIG Social Run"), time: "09:00", world: bi("Toate Lumile", "All Worlds"), color: "yellow", boss: true },
    ],
  };
  await add("program", program);

  // PRICING
  const pricing: PricingData = {
    heading: { lead: bi("ALEGE-ȚI", "CHOOSE YOUR"), accent: bi("ORBITA", "ORBIT") },
    intro: bi(
      "Trei moduri de a intra în MUEVE UNIVERSE. Același acces, ritm diferit.",
      "Three ways to enter MUEVE UNIVERSE. Same access, different rhythm.",
    ),
    tiers: [
      {
        id: "tier-pass",
        title: bi("MUEVE UNIVERSE PASS", "MUEVE UNIVERSE PASS"),
        subtitle: bi("Acces premium cu toate beneficiile", "Premium access with all perks"),
        featured: true,
        plans: [
          {
            id: "plan-pass",
            name: bi("PASS", "PASS"),
            checkoutMode: "subscription" as const,
            price: "39.90",
            originalPrice: "59.90",
            currency: bi("lei", "RON"),
            period: bi("/ lună", "/ month"),
            badge: bi("REDUS", "DEAL"),
            featuresTitle: bi("CE INCLUDE?", "WHAT\u2019S INCLUDED?"),
            features: [
              bi("20% FOAM", "20% FOAM"),
              bi("30% PADEL", "30% PADEL"),
              bi("10% VISA MED", "10% VISA MED"),
              bi("20% DISCOUNT LA MERCH", "20% DISCOUNT ON MERCH"),
              bi("PRODUSE GRATUITE LUNAR", "FREE PRODUCTS EVERY MONTH"),
              bi("+++", "+++"),
            ],
            highlighted: true,
            ctaLabel: bi("INTRĂ", "GET IT"),
            ctaHref: "#join",
          },
        ],
      },
      {
        id: "tier-classes",
        title: bi("CLASE & ABONAMENTE", "CLASSES & MEMBERSHIPS"),
        subtitle: bi("De la drop-in la planuri pe 3 luni", "From drop-in to 3-month plans"),
        plans: [
          {
            id: "plan-class",
            name: bi("MUEVE CLASS", "MUEVE CLASS"),
            checkoutMode: "payment" as const,
            price: "34.90",
            originalPrice: "49.90",
            currency: bi("lei", "RON"),
            period: bi("/ sesiune", "/ class"),
            tagline: bi("Drop-in — o singură clasă", "Drop-in — single class"),
            features: [
              bi("O clasă, oricând", "A single class, anytime"),
              bi("Fără abonament", "No subscription"),
              bi("Încercare pentru începători", "Try-before-you-join"),
            ],
            ctaLabel: bi("REZERVĂ", "BOOK"),
            ctaHref: "#join",
          },
          {
            id: "plan-orbit",
            name: bi("ORBIT", "ORBIT"),
            checkoutMode: "subscription" as const,
            price: "119",
            originalPrice: "169.90",
            currency: bi("lei", "RON"),
            period: bi("/ lună", "/ month"),
            tagline: bi("4 clase pe lună", "4 classes per month"),
            features: [
              bi("Acces la toate lumile", "Access to all worlds"),
              bi("Rezervare prioritară", "Priority booking"),
              bi("Anulare gratuită", "Free cancellation"),
            ],
            ctaLabel: bi("INTRĂ PE ORBITĂ", "ENTER ORBIT"),
            ctaHref: "#join",
          },
          {
            id: "plan-galaxy",
            name: bi("GALAXY", "GALAXY"),
            checkoutMode: "subscription" as const,
            price: "219",
            originalPrice: "279.90",
            currency: bi("lei", "RON"),
            period: bi("/ lună", "/ month"),
            tagline: bi("8 clase pe lună", "8 classes per month"),
            badge: bi("POPULAR", "POPULAR"),
            highlighted: true,
            features: [
              bi("Acces la toate lumile", "Access to all worlds"),
              bi("Rezervare prioritară", "Priority booking"),
              bi("Invitații la evenimente", "Event invites"),
            ],
            ctaLabel: bi("EXPLOREAZĂ GALAXIA", "EXPLORE GALAXY"),
            ctaHref: "#join",
          },
          {
            id: "plan-universe",
            name: bi("UNIVERSE", "UNIVERSE"),
            checkoutMode: "payment" as const,
            price: "599",
            originalPrice: "769",
            currency: bi("lei", "RON"),
            period: bi("/ 3 luni", "/ 3 months"),
            tagline: bi("8 clase / 3 luni", "8 classes / 3 months"),
            features: [
              bi("Flexibilitate 3 luni", "3-month flexibility"),
              bi("Acces la toate lumile", "Access to all worlds"),
              bi("Invitații la evenimente", "Event invites"),
            ],
            ctaLabel: bi("CUCEREȘTE UNIVERSUL", "CONQUER UNIVERSE"),
            ctaHref: "#join",
          },
        ],
      },
    ],
    note: bi(
      "Plata personal: 10% reducere pentru plata cash.",
      "In-person payment: 10% discount for cash payment.",
    ),
  };
  await add("pricing", pricing);

  // WORLDS
  const worlds: WorldsData = {
    heading: { lead: bi("PATRU LUMI.", "FOUR WORLDS."), accent: bi("UN UNIVERS.", "ONE UNIVERSE.") },
    intro: bi(
      "Fiecare lume e o dimensiune a mișcării. Alege-ți drumul — sau stăpânește-le pe toate.",
      "Each world is a dimension of movement. Choose your path — or master them all.",
    ),
    worlds: [
      {
        id: "forge", key: "forge", bigIcon: "FORGE",
        label: bi("Calisthenics", "Calisthenics"),
        title: bi("FORJA", "THE FORGE"),
        body: bi(
          "Unde forța brută întâlnește arta. Construiește-ți corpul doar cu gravitația și voința. Supraîncărcare progresivă, stând pe mâini, muscle-ups — testul suprem al stăpânirii de sine.",
          "Where raw strength meets artistry. Build your body with nothing but gravity and will. Progressive overload, handstands, muscle-ups — the ultimate test of self-mastery.",
        ),
        tags: [bi("Forță", "Strength"), bi("Control", "Control"), bi("Măiestrie", "Mastery")],
      },
      {
        id: "temple", key: "temple", bigIcon: "TEMPLE",
        label: bi("Yoga", "Yoga"),
        title: bi("TEMPLUL", "THE TEMPLE"),
        body: bi(
          "Spațiul dintre respirații. Sesiuni la răsărit care reconectează corpul și mintea. Flexibilitate, echilibru și acel tip de forță care vine din liniște.",
          "The space between breaths. Sunrise flows that reconnect body and mind. Flexibility, balance, and the kind of strength that comes from stillness.",
        ),
        tags: [bi("Echilibru", "Balance"), bi("Respirație", "Breath"), bi("Flow", "Flow")],
      },
      {
        id: "path", key: "path", bigIcon: "PATH",
        label: bi("Alergare", "Running"),
        title: bi("DRUMUL", "THE PATH"),
        body: bi(
          "Fiecare pas e o conversație cu orașul. Alergări de seară care limpezesc mintea, rute lungi de sâmbătă care testează voința, alergări sociale de duminică care construiesc tribul.",
          "Every step is a conversation with the city. Evening runs that clear the mind, long Saturday routes that test the will, Sunday social runs that build the tribe.",
        ),
        tags: [bi("Rezistență", "Endurance"), bi("Libertate", "Freedom"), bi("Trib", "Tribe")],
      },
      {
        id: "sanctuary", key: "sanctuary", bigIcon: "SANCTUARY",
        label: bi("Relaxare & Conexiune", "Relax & Connect"),
        title: bi("SANCTUARUL", "THE SANCTUARY"),
        body: bi(
          "Unde competiția devine conexiune. Sporturi de echipă, evenimente sociale și energia care vine doar din mișcarea împreună. Aici necunoscuții devin echipă.",
          "Where competition becomes connection. Team sports, social events, and the energy that only comes from moving together. This is where strangers become crew.",
        ),
        tags: [bi("Comunitate", "Community"), bi("Bucurie", "Joy"), bi("Conexiune", "Connection")],
      },
    ],
  };
  await add("worlds", worlds);

  // MISSION
  const mission: MissionData = {
    heading: { lead: bi("", "OUR"), accent: bi("MISIUNEA", "MISSION") },
    intro: bi(
      "MUEVE UNIVERSE nu e o sală. Nu e un club de alergare. Nu e un studio de yoga. E un univers al mișcării — un sistem viu unde practica fizică devine ritual zilnic.",
      "MUEVE UNIVERSE isn't a gym. It's not a running club. It's not a yoga studio. It's a movement universe — a living system where physical practice becomes daily ritual.",
    ),
    values: [
      { id: "v1", title: bi("Ritual, nu motivație", "Ritual over motivation"), body: bi("Motivația dispare. Sistemele rămân. MUEVE UNIVERSE îți dă structura săptămânală ca să nu te mai întrebi 'ar trebui să merg azi?'", "Motivation fades. Systems stay. MUEVE UNIVERSE gives you the weekly structure so you never have to think 'should I go today?'") },
      { id: "v2", title: bi("Varietatea e sistemul", "Variety is the system"), body: bi("Corpul tău are nevoie de mai mult. Calisthenics construiește. Yoga echilibrează. Alergarea eliberează. Împreună — te completează.", "Your body needs more than one thing. Calisthenics builds. Yoga balances. Running liberates. Together — they complete you.") },
      { id: "v3", title: bi("Energia tribului", "Tribe energy"), body: bi("Antrenamentul solo are limite. Când alergi cu 50 de oameni într-o duminică dimineață, ceva se schimbă. Asta e energia MUEVE UNIVERSE.", "Solo training has limits. When you run with 50 people on a Sunday morning, something shifts. That's MUEVE UNIVERSE energy.") },
    ],
  };
  await add("mission", mission);

  // STATS
  const stats: StatsData = {
    eyebrow: bi("COMUNITATE", "COMMUNITY"),
    heading: bi("", ""),
    items: [
      { id: "s-1", value: bi("40%", "40%"), label: bi("Creștere lunară", "Monthly growth") },
      { id: "s-2", value: bi("15+", "15+"), label: bi("Tipuri de activități", "Activity types") },
      { id: "s-3", value: bi("0", "0"), label: bi("Echipament necesar", "Gear required") },
      { id: "s-4", value: bi("100%", "100%"), label: bi("Oameni reali", "Real people") },
    ],
  };
  await add("stats", stats);

  // JOIN
  const join: JoinData = {
    heading: { lead: bi("GATA", "READY"), accent: bi("SĂ INTRI?", "TO ENTER?") },
    body: bi(
      "Lasă-ți emailul. Te teleportăm în MUEVE UNIVERSE. Prima sesiune e pe noi.",
      "Drop your email. We'll beam you into MUEVE UNIVERSE. First session is free.",
    ),
    emailPlaceholder: bi("email@exemplu.com", "email@example.com"),
    submitLabel: bi("LANSEAZĂ", "LAUNCH"),
  };
  await add("join", join);

  // FOOTER
  const footer: FooterData = {
    copyright: bi("© 2026 MUEVE UNIVERSE", "© 2026 MUEVE UNIVERSE"),
    socials: [
      { id: "ig", label: "Instagram", href: "#", icon: "instagram" },
      { id: "tt", label: "TikTok", href: "#", icon: "tiktok" },
    ],
  };
  await add("footer", footer);

  console.log(`  ${order} sections seeded`);
  console.log("done.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
