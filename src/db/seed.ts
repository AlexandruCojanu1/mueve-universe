import { db } from "./index";
import { theme, sections, users } from "./schema";
import bcrypt from "bcryptjs";
import {
  DEFAULT_COLORS,
  DEFAULT_FONTS,
  type HeroData,
  type WorldsData,
  type ProgramData,
  type MissionData,
  type JoinData,
  type FooterData,
  type NavData,
} from "../lib/content-types";

const bi = (ro: string, en: string) => ({ ro, en });

async function main() {
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
  const email = process.env.ADMIN_EMAIL || "admin@example.com";
  const pw = process.env.ADMIN_PASSWORD || "changeme";
  const hash = await bcrypt.hash(pw, 10);
  await db.insert(users).values({
    email,
    passwordHash: hash,
    name: "MUEVE Admin",
  });
  console.log(`  admin user: ${email}`);

  // ── Sections, in display order ──
  let order = 0;
  const add = (type: string, data: Record<string, unknown>, visible = true) =>
    db.insert(sections).values({ type, order: order++, visible, data });

  // NAV
  const nav: NavData = {
    logo: "MUEVE",
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
      noon: bi("PRÂNZ", "MIDDAY"),
      pm: bi("SEARA", "EVENING"),
    },
    joinLabel: bi("INTRĂ ÎN MISIUNE", "JOIN MISSION"),
    slots: [
      // morning slots
      { id: "am-1", day: 1, row: "am", activity: bi("Yoga la Răsărit", "Sunrise Yoga"), time: "06:30", world: bi("Templul", "Temple"), color: "purple" },
      { id: "am-3", day: 3, row: "am", activity: bi("Yoga la Răsărit", "Sunrise Yoga"), time: "06:30", world: bi("Templul", "Temple"), color: "purple" },
      { id: "am-6", day: 6, row: "am", activity: bi("THE BIG Social Run", "THE BIG Social Run"), time: "09:00", world: bi("Toate Lumile", "All Worlds"), color: "yellow", boss: true },
      // evening slots
      { id: "pm-0", day: 0, row: "pm", activity: bi("Sporturi de Echipă", "Team Sports"), time: "19:00", world: bi("Sanctuarul", "Sanctuary"), color: "orange" },
      { id: "pm-1", day: 1, row: "pm", activity: bi("Alergare Seara", "Evening Run"), time: "19:30", world: bi("Drumul", "Path"), color: "purple" },
      { id: "pm-2", day: 2, row: "pm", activity: bi("Calisthenics", "Calisthenics"), time: "18:30", world: bi("Forja", "Forge"), color: "blue" },
      { id: "pm-3", day: 3, row: "pm", activity: bi("Alergare Seara", "Evening Run"), time: "19:30", world: bi("Drumul", "Path"), color: "purple" },
      { id: "pm-4", day: 4, row: "pm", activity: bi("Calisthenics", "Calisthenics"), time: "18:30", world: bi("Forja", "Forge"), color: "blue" },
      { id: "pm-5", day: 5, row: "pm", activity: bi("Alergare Lungă", "Long Evening Run"), time: "18:00", world: bi("Drumul", "Path"), color: "orange" },
    ],
  };
  await add("program", program);

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
      "MUEVE nu e o sală. Nu e un club de alergare. Nu e un studio de yoga. E un univers al mișcării — un sistem viu unde practica fizică devine ritual zilnic.",
      "MUEVE isn't a gym. It's not a running club. It's not a yoga studio. It's a movement universe — a living system where physical practice becomes daily ritual.",
    ),
    values: [
      { id: "v1", title: bi("Ritual, nu motivație", "Ritual over motivation"), body: bi("Motivația dispare. Sistemele rămân. MUEVE îți dă structura săptămânală ca să nu te mai întrebi 'ar trebui să merg azi?'", "Motivation fades. Systems stay. MUEVE gives you the weekly structure so you never have to think 'should I go today?'") },
      { id: "v2", title: bi("Varietatea e sistemul", "Variety is the system"), body: bi("Corpul tău are nevoie de mai mult. Calisthenics construiește. Yoga echilibrează. Alergarea eliberează. Împreună — te completează.", "Your body needs more than one thing. Calisthenics builds. Yoga balances. Running liberates. Together — they complete you.") },
      { id: "v3", title: bi("Energia tribului", "Tribe energy"), body: bi("Antrenamentul solo are limite. Când alergi cu 50 de oameni într-o duminică dimineață, ceva se schimbă. Asta e energia MUEVE.", "Solo training has limits. When you run with 50 people on a Sunday morning, something shifts. That's MUEVE energy.") },
    ],
  };
  await add("mission", mission);

  // JOIN
  const join: JoinData = {
    heading: { lead: bi("GATA", "READY"), accent: bi("SĂ INTRI?", "TO ENTER?") },
    body: bi(
      "Lasă-ți emailul. Te teleportăm în universul MUEVE. Prima sesiune e pe noi.",
      "Drop your email. We'll beam you into the MUEVE universe. First session is free.",
    ),
    emailPlaceholder: bi("email@exemplu.com", "email@example.com"),
    submitLabel: bi("LANSEAZĂ", "LAUNCH"),
  };
  await add("join", join);

  // FOOTER
  const footer: FooterData = {
    copyright: bi("© 2026 MUEVE Universe", "© 2026 MUEVE Universe"),
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
