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
      { label: bi("Calendar", "Calendar"), href: "#prog" },
      { label: bi("Abonamente", "Memberships"), href: "#pricing" },
      { label: bi("Misiuni", "Missions"), href: "#mission" },
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
    heading: { lead: bi("TRAINING", "TRAINING"), accent: bi("SESSIONS", "SESSIONS") },
    intro: bi(
      "Click pe oricare din sesiuni pentru detalii.",
      "Click any session for details.",
    ),
    dayLabels: [
      bi("LUNI", "MONDAY"),
      bi("MARȚI", "TUESDAY"),
      bi("MIERCURI", "WEDNESDAY"),
      bi("JOI", "THURSDAY"),
      bi("VINERI", "FRIDAY"),
      bi("SÂMBĂTĂ", "SATURDAY"),
      bi("DUMINICĂ", "SUNDAY"),
    ],
    rowLabels: {
      am: bi("SUNRISE", "SUNRISE"),
      pm: bi("SUNSET", "SUNSET"),
    },
    joinLabel: bi("INTRĂ ÎN MISIUNE", "JOIN MISSION"),
    slots: [
      // MON — MOVEMENT FOR ALL (sunrise)
      { id: "am-0", day: 0, row: "am", activity: bi("Movement for All", "Movement for All"), time: "06:30", world: bi("Toate Lumile", "All Worlds"), color: "yellow" },
      // TUE — SOCIAL RUN (sunset)
      { id: "pm-1", day: 1, row: "pm", activity: bi("Social Run", "Social Run"), time: "19:30", world: bi("Drumul", "Path"), color: "purple" },
      // WED — YOGA (sunrise)
      { id: "am-2", day: 2, row: "am", activity: bi("Yoga", "Yoga"), time: "06:30", world: bi("Templul", "Temple"), color: "purple" },
      // THU — CALISTHENICS (sunrise)
      { id: "am-3", day: 3, row: "am", activity: bi("Calisthenics", "Calisthenics"), time: "06:30", world: bi("Forja", "Forge"), color: "blue" },
      // FRI — COMING SOON
      { id: "am-4", day: 4, row: "am", activity: bi("Coming Soon", "Coming Soon"), time: "TBA", world: bi("", ""), color: "orange" },
      // SAT — MERS PE JOS (coming soon)
      { id: "am-5", day: 5, row: "am", activity: bi("Mers pe jos (în curând)", "Walking (coming soon)"), time: "10:00", world: bi("Drumul", "Path"), color: "orange" },
      // SUN — THE BIG SOCIAL RUN (main event)
      { id: "am-6", day: 6, row: "am", activity: bi("THE BIG Social Run", "THE BIG Social Run"), time: "09:00", world: bi("Toate Lumile", "All Worlds"), color: "yellow", boss: true },
    ],
  };
  await add("program", program);

  // PRICING
  const pricing: PricingData = {
    heading: { lead: bi("MUEVE UNIVERSE", "MUEVE UNIVERSE"), accent: bi("PASS", "PASS") },
    intro: bi(
      "Acces premium la toate beneficiile. Accesul la clase se face pe baza acestui card.",
      "Premium access to every perk. This card is your key to every class.",
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
            classCount: 1,
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
            classCount: 4,
            name: bi("ORBIT", "ORBIT"),
            checkoutMode: "payment" as const,
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
            classCount: 8,
            name: bi("GALAXY", "GALAXY"),
            checkoutMode: "payment" as const,
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
            classCount: 17,
            name: bi("UNIVERSE", "UNIVERSE"),
            checkoutMode: "payment" as const,
            price: "599",
            currency: bi("lei", "RON"),
            period: bi("/ lună", "/ month"),
            tagline: bi("Nelimitat — până la 10 clase/lună*", "Unlimited — up to 10 classes/month*"),
            features: [
              bi("*Până la 10 clase incluse pe lună", "*Up to 10 classes included per month"),
              bi("Acces la toate lumile", "Access to all worlds"),
              bi("Rezervare prioritară", "Priority booking"),
              bi("Invitații la evenimente", "Event invites"),
            ],
            ctaLabel: bi("CUCEREȘTE UNIVERSUL", "CONQUER UNIVERSE"),
            ctaHref: "#join",
          },
        ],
      },
    ],
    note: bi("", ""),
  };
  // (pricing is added later, AFTER worlds/mission/stats — see below)

  // WORLDS
  const worlds: WorldsData = {
    heading: { lead: bi("CINCI LUMI.", "FIVE WORLDS."), accent: bi("UN UNIVERS.", "ONE UNIVERSE.") },
    intro: bi(
      "Fiecare lume e o dimensiune a mișcării. Alege-ți drumul, sau stăpânește-le pe toate.",
      "Each world is a dimension of movement. Choose your path, or master them all.",
    ),
    worlds: [
      {
        id: "forge", key: "forge", bigIcon: "FORGE",
        label: bi("Calisthenics", "Calisthenics"),
        title: bi("CALISTHENICS", "CALISTHENICS"),
        body: bi(
          "Handstands. Muscle-ups. Strength flow.\nMișcare construită prin repetiție, precizie și voință. Putere funcțională. Control total.",
          "Handstands. Muscle-ups. Strength flow.\nMovement built through repetition, precision and will. Functional power. Total control.",
        ),
        tags: [bi("Forță", "Strength"), bi("Control", "Control"), bi("Măiestrie", "Mastery")],
      },
      {
        id: "temple", key: "temple", bigIcon: "YOGA",
        label: bi("Yoga", "Yoga"),
        title: bi("YOGA", "YOGA"),
        body: bi(
          "Respirația conduce mișcarea.\nCorpul încetinește. Mintea se aliniază.\nMobilitate, echilibru și prezență — construite prin practică.\nPutere calmă, din interior spre exterior.",
          "Breath leads movement.\nThe body slows. The mind aligns.\nMobility, balance and presence — built through practice.\nCalm power, from inside out.",
        ),
        tags: [bi("Echilibru", "Balance"), bi("Respirație", "Breath"), bi("Flow", "Flow")],
      },
      {
        id: "punctul-zero", key: "sanctuary", bigIcon: "POINT 0",
        label: bi("Mișcare", "Movement"),
        title: bi("MIȘCARE — PUNCTUL 0", "MOVEMENT — POINT 0"),
        body: bi(
          "Mișcare simplă, ghidată, fără presiune.\nConstruiești rezistență, mobilitate și încredere în propriul ritm.\nAici începi când nu știi unde să începi.",
          "Simple, guided movement — no pressure.\nYou build endurance, mobility and confidence at your own pace.\nThis is where you start when you don't know where to start.",
        ),
        tags: [bi("Început", "Start"), bi("Ritm propriu", "Own pace"), bi("Fundație", "Foundation")],
      },
      {
        id: "path", key: "path", bigIcon: "RUN",
        label: bi("Alergare", "Running"),
        title: bi("ALERGARE", "RUNNING"),
        body: bi(
          "Mișcarea devine mai ușoară când o faci împreună.\nEnergie, conexiune și progres real.\nÎți crești condiția fizică, mobilitatea și anduranța, în timp ce cunoști oameni care sunt pe același drum.",
          "Movement gets easier when you do it together.\nEnergy, connection and real progress.\nYou build fitness, mobility and endurance while meeting people on the same path.",
        ),
        tags: [bi("Rezistență", "Endurance"), bi("Libertate", "Freedom"), bi("Trib", "Tribe")],
      },
      {
        id: "walk", key: "walk", bigIcon: "WALK",
        label: bi("Mers pe jos", "Walking"),
        title: bi("MERS PE JOS", "WALKING"),
        body: bi(
          "În curând · Sâmbătă 10:00\n\nFundația oricărei călătorii.\nPas cu pas, mintea se eliberează, iar corpul își regăsește ritmul natural.\nConstruiești claritate mentală, vitalitate și o bază solidă pentru sănătatea ta.\nCea mai simplă și accesibilă formă de a merge înainte, zi de zi.",
          "Coming soon · Saturday 10:00\n\nThe foundation of every journey.\nStep by step, the mind clears and the body finds its natural rhythm.\nYou build mental clarity, vitality and a solid base for your health.\nThe simplest, most accessible way forward — day by day.",
        ),
        tags: [bi("Fundație", "Foundation"), bi("Claritate", "Clarity"), bi("Vitalitate", "Vitality")],
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

  // PRICING — placed after story (worlds/mission/stats) so users feel the
  // experience before they see the price tags.
  await add("pricing", pricing);

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
      { id: "ig", label: "Instagram", href: "https://www.instagram.com/mueve_club/", icon: "instagram" },
      { id: "tt", label: "TikTok", href: "https://www.tiktok.com/@mueve_club", icon: "tiktok" },
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
