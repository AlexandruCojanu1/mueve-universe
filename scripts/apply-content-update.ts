/**
 * Non-destructive content update.
 *
 * Runs the SAME content definitions as seed.ts but updates rows in place
 * (by section.type) instead of wiping the table. Use this on prod when you
 * want the latest copy/order without losing user/auth tables.
 *
 *   tsx --env-file=.env.local scripts/apply-content-update.ts
 *
 * Pass FORCE_PROD=1 to allow running with NODE_ENV=production.
 */
import { db } from "../src/db";
import { sections } from "../src/db/schema";
import { eq } from "drizzle-orm";
import {
  type HeroData,
  type WorldsData,
  type ProgramData,
  type PricingData,
  type MissionData,
  type StatsData,
  type JoinData,
  type FooterData,
  type NavData,
} from "../src/lib/content-types";

const bi = (ro: string, en: string) => ({ ro, en });

async function main() {
  if (process.env.NODE_ENV === "production" && process.env.FORCE_PROD !== "1") {
    console.error("refused: NODE_ENV=production. Set FORCE_PROD=1 to proceed.");
    process.exit(1);
  }

  // Display order matches seed.ts (post-reorder)
  const ordered: Array<{ type: string; data: Record<string, unknown> }> = [];
  let i = 0;
  const add = (type: string, data: Record<string, unknown>) => {
    ordered.push({ type, data });
    i++;
  };

  const nav: NavData = {
    logo: "MUEVE UNIVERSE",
    links: [
      { label: bi("Lumi", "Worlds"), href: "#worlds" },
      { label: bi("Program", "Program"), href: "#prog" },
      { label: bi("Misiune", "Mission"), href: "#mission" },
      { label: bi("Intră", "Join"), href: "#join" },
    ],
  };
  add("nav", nav);

  const hero: HeroData = {
    headingTop: bi("INTRĂ", "ENTER"),
    headingAccent: bi("ÎN UNIVERSUL", "THE UNIVERSE"),
    headingBottom: bi("MIȘCĂRII", "OF MOVEMENT"),
    sub: bi(
      "Calisthenics. Yoga. Alergare. Comunitate. Un ecosistem viu. Ritualul tău zilnic.",
      "Calisthenics. Yoga. Running. Community. One living ecosystem. Your daily ritual.",
    ),
    scrollLabel: bi("", ""),
  };
  add("hero", hero);

  const program: ProgramData = {
    heading: { lead: bi("TRAINING", "TRAINING"), accent: bi("SESSIONS", "SESSIONS") },
    intro: bi(
      "Click pe oricare din sesiuni pentru detalii.",
      "Click any session for details.",
    ),
    dayLabels: [
      bi("LUN", "MON"), bi("MAR", "TUE"), bi("MIE", "WED"), bi("JOI", "THU"),
      bi("VIN", "FRI"), bi("SÂM", "SAT"), bi("DUM", "SUN"),
    ],
    rowLabels: { am: bi("SUNRISE", "SUNRISE"), pm: bi("SUNSET", "SUNSET") },
    joinLabel: bi("INTRĂ ÎN MISIUNE", "JOIN MISSION"),
    slots: [
      { id: "am-0", day: 0, row: "am", activity: bi("Movement for All", "Movement for All"), time: "06:30", world: bi("Toate Lumile", "All Worlds"), color: "yellow" },
      { id: "pm-1", day: 1, row: "pm", activity: bi("Social Run", "Social Run"), time: "19:30", world: bi("Drumul", "Path"), color: "purple" },
      { id: "am-2", day: 2, row: "am", activity: bi("Yoga", "Yoga"), time: "06:30", world: bi("Templul", "Temple"), color: "purple" },
      { id: "am-3", day: 3, row: "am", activity: bi("Calisthenics", "Calisthenics"), time: "06:30", world: bi("Forja", "Forge"), color: "blue" },
      { id: "am-4", day: 4, row: "am", activity: bi("Coming Soon", "Coming Soon"), time: "TBA", world: bi("", ""), color: "orange" },
      { id: "am-5", day: 5, row: "am", activity: bi("Mers pe jos (în curând)", "Walking (coming soon)"), time: "10:00", world: bi("Drumul", "Path"), color: "orange" },
      { id: "am-6", day: 6, row: "am", activity: bi("THE BIG Social Run", "THE BIG Social Run"), time: "09:00", world: bi("Toate Lumile", "All Worlds"), color: "yellow", boss: true },
    ],
  };
  add("program", program);

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
          "Handstands. Muscle-ups. Strength flow. Mișcare construită prin repetiție, precizie și voință. Putere funcțională. Control total.",
          "Handstands. Muscle-ups. Strength flow. Movement built through repetition, precision and will. Functional power. Total control.",
        ),
        tags: [bi("Forță", "Strength"), bi("Control", "Control"), bi("Măiestrie", "Mastery")],
      },
      {
        id: "temple", key: "temple", bigIcon: "TEMPLE",
        label: bi("Yoga", "Yoga"),
        title: bi("TEMPLUL", "THE TEMPLE"),
        body: bi(
          "Respirația conduce mișcarea. Corpul încetinește. Mintea se aliniază. Mobilitate, echilibru și prezență — construite prin practică. Putere calmă, din interior spre exterior.",
          "Breath leads movement. The body slows. The mind aligns. Mobility, balance and presence — built through practice. Calm power, from inside out.",
        ),
        tags: [bi("Echilibru", "Balance"), bi("Respirație", "Breath"), bi("Flow", "Flow")],
      },
      {
        id: "path", key: "path", bigIcon: "PATH",
        label: bi("Alergare & Mers pe jos", "Running & Walking"),
        title: bi("DRUMUL", "THE PATH"),
        body: bi(
          "Alergare: Mișcarea devine mai ușoară când o faci împreună. Energie, conexiune și progres real. Îți crești condiția fizică, mobilitatea și anduranța, în timp ce cunoști oameni care sunt pe același drum.\n\nMers pe jos: Fundația oricărei călătorii. Pas cu pas, mintea se eliberează, iar corpul își regăsește ritmul natural. Cea mai simplă și accesibilă formă de a merge înainte, zi de zi.",
          "Running: Movement gets easier when you do it together. Energy, connection and real progress. You build fitness, mobility and endurance while meeting people on the same path.\n\nWalking: The foundation of every journey. Step by step, the mind clears and the body finds its natural rhythm. The simplest, most accessible way forward — day by day.",
        ),
        tags: [bi("Rezistență", "Endurance"), bi("Libertate", "Freedom"), bi("Trib", "Tribe")],
      },
      {
        id: "punctul-zero", key: "sanctuary", bigIcon: "POINT 0",
        label: bi("Mișcare — Punctul 0", "Movement — Point 0"),
        title: bi("PUNCTUL 0", "POINT ZERO"),
        body: bi(
          "Mișcare simplă, ghidată, fără presiune. Construiești rezistență, mobilitate și încredere în propriul ritm. Aici începi când nu știi unde să începi.",
          "Simple, guided movement — no pressure. You build endurance, mobility and confidence at your own pace. This is where you start when you don't know where to start.",
        ),
        tags: [bi("Început", "Start"), bi("Ritm propriu", "Own pace"), bi("Fundație", "Foundation")],
      },
    ],
  };
  add("worlds", worlds);

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
  add("mission", mission);

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
  add("stats", stats);

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
            featuresTitle: bi("CE INCLUDE?", "WHAT’S INCLUDED?"),
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
  add("pricing", pricing);

  const join: JoinData = {
    heading: { lead: bi("GATA", "READY"), accent: bi("SĂ INTRI?", "TO ENTER?") },
    body: bi(
      "Lasă-ți emailul. Te teleportăm în MUEVE UNIVERSE. Prima sesiune e pe noi.",
      "Drop your email. We'll beam you into MUEVE UNIVERSE. First session is free.",
    ),
    emailPlaceholder: bi("email@exemplu.com", "email@example.com"),
    submitLabel: bi("LANSEAZĂ", "LAUNCH"),
  };
  add("join", join);

  const footer: FooterData = {
    copyright: bi("© 2026 MUEVE UNIVERSE", "© 2026 MUEVE UNIVERSE"),
    socials: [
      { id: "ig", label: "Instagram", href: "#", icon: "instagram" },
      { id: "tt", label: "TikTok", href: "#", icon: "tiktok" },
    ],
  };
  add("footer", footer);

  console.log(`Applying ${ordered.length} sections (in-place, by type)...`);

  // Update by type. Only one row per type is expected. If multiple exist, the
  // first match (lowest order) is updated and the rest are deleted to keep the
  // public site deterministic.
  for (let idx = 0; idx < ordered.length; idx++) {
    const { type, data } = ordered[idx];
    const rows = await db.select().from(sections).where(eq(sections.type, type));
    if (rows.length === 0) {
      await db.insert(sections).values({ type, order: idx, visible: true, data });
      console.log(`  + inserted  ${type} (order ${idx})`);
    } else {
      const keep = rows[0];
      await db
        .update(sections)
        .set({ data, order: idx, visible: true })
        .where(eq(sections.id, keep.id));
      for (let k = 1; k < rows.length; k++) {
        await db.delete(sections).where(eq(sections.id, rows[k].id));
      }
      console.log(`  ✓ updated   ${type} (order ${idx})`);
    }
  }

  console.log("done.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
