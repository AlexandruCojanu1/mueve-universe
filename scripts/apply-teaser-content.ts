/**
 * Teaser-mode content patch (2026-06): surgically updates the live `sections`
 * rows without overwriting admin-edited copy (headings, intros etc.).
 *
 *   - program: replaces only the `slots` array (4 teaser cells added)
 *   - pricing: replaces only plan-pass `features` (7 prefix||blur lines)
 *   - worlds:  marks Calisthenics as teaser, appends the placeholder world,
 *              sets the tagline
 *   - mission: sets teaser=true
 *
 *   FORCE_PROD=1 tsx --env-file=.env.local scripts/apply-teaser-content.ts
 */
import { db } from "../src/db";
import { sections } from "../src/db/schema";
import { eq } from "drizzle-orm";
import type {
  ProgramData,
  PricingData,
  WorldsData,
  MissionData,
  ProgramSlot,
} from "../src/lib/content-types";

const bi = (ro: string, en: string) => ({ ro, en });

if (process.env.NODE_ENV === "production" && process.env.FORCE_PROD !== "1") {
  console.error("refused: NODE_ENV=production and FORCE_PROD!=1");
  process.exit(1);
}

const TEASER_SLOTS: ProgramSlot[] = [
  { id: "am-0", day: 0, row: "am", activity: bi("Movement for All", "Movement for All"), time: "06:30", world: bi("Toate Lumile", "All Worlds"), color: "yellow" },
  { id: "am-1", day: 1, row: "am", activity: bi("Mobility Flow", "Mobility Flow"), time: "06:30", world: bi("Templul", "Temple"), color: "orange", teaser: true },
  { id: "pm-1", day: 1, row: "pm", activity: bi("Alergarea fetelor", "Girls' Run"), time: "19:30", world: bi("Drumul", "Path"), color: "purple" },
  { id: "am-2", day: 2, row: "am", activity: bi("Yoga", "Yoga"), time: "06:30", world: bi("Templul", "Temple"), color: "purple" },
  { id: "am-3", day: 3, row: "am", activity: bi("Calisthenics", "Calisthenics"), time: "06:30", world: bi("Forja", "Forge"), color: "blue", teaser: true },
  { id: "pm-3", day: 3, row: "pm", activity: bi("Alergare socială", "Social Run"), time: "19:30", world: bi("Drumul", "Path"), color: "purple" },
  { id: "am-4", day: 4, row: "am", activity: bi("Strength Lab", "Strength Lab"), time: "06:30", world: bi("Forja", "Forge"), color: "orange", teaser: true },
  { id: "pm-5", day: 5, row: "pm", activity: bi("Sunset Session", "Sunset Session"), time: "19:30", world: bi("Toate Lumile", "All Worlds"), color: "orange", teaser: true },
  { id: "am-6", day: 6, row: "am", activity: bi("Marea Alergare", "The Big Run"), time: "09:00", world: bi("Toate Lumile", "All Worlds"), color: "yellow", boss: true },
];

const PASS_FEATURES = [
  bi("20% ||FOAM", "20% ||FOAM"),
  bi("30% ||PADEL", "30% ||PADEL"),
  bi("10% ||VISA MED", "10% ||VISA MED"),
  bi("10% ||PARTENER NOU", "10% ||NEW PARTNER"),
  bi("20% ||DISCOUNT LA MERCH", "20% ||DISCOUNT ON MERCH"),
  bi("FREE ||PRODUSE LUNAR", "FREE ||MONTHLY PRODUCTS"),
  bi("FREE ||SURPRIZĂ LA LANSARE", "FREE ||LAUNCH SURPRISE"),
];

const SOON_WORLD = {
  id: "soon",
  key: "walk" as const,
  bigIcon: "SOON",
  label: bi("În curând", "Coming soon"),
  title: bi("O LUME NOUĂ", "A NEW WORLD"),
  body: bi(
    "O dimensiune nouă a mișcării se deschide în MUEVE UNIVERSE.\nDetaliile vin la lansare.",
    "A new dimension of movement opens inside MUEVE UNIVERSE.\nDetails at launch.",
  ),
  tags: [bi("Mister", "Mystery"), bi("Lansare", "Launch"), bi("Univers", "Universe")],
  teaser: true,
};

async function loadRow<T>(type: string): Promise<{ id: string; data: T }> {
  const row = (
    await db
      .select({ id: sections.id, data: sections.data })
      .from(sections)
      .where(eq(sections.type, type))
      .limit(1)
  )[0];
  if (!row) throw new Error(`no sections row of type "${type}"`);
  return { id: row.id, data: row.data as T };
}

async function main() {
  // ── program: replace slots only ──
  {
    const { id, data } = await loadRow<ProgramData>("program");
    data.slots = TEASER_SLOTS;
    await db.update(sections).set({ data }).where(eq(sections.id, id));
    console.log("program: slots replaced (4 teaser cells)");
  }

  // ── pricing: replace plan-pass features only ──
  {
    const { id, data } = await loadRow<PricingData>("pricing");
    let found = false;
    for (const tier of data.tiers) {
      for (const plan of tier.plans) {
        if (plan.id === "plan-pass") {
          plan.features = PASS_FEATURES;
          found = true;
        }
      }
    }
    if (!found) throw new Error("plan-pass not found in pricing data");
    await db.update(sections).set({ data }).where(eq(sections.id, id));
    console.log("pricing: plan-pass features replaced (7 teaser lines)");
  }

  // ── worlds: teaser Calisthenics, append placeholder, set tagline ──
  {
    const { id, data } = await loadRow<WorldsData>("worlds");
    const forge = data.worlds.find((w) => w.key === "forge");
    if (!forge) throw new Error("forge (Calisthenics) world not found");
    forge.teaser = true;
    if (!data.worlds.some((w) => w.id === "soon")) data.worlds.push(SOON_WORLD);
    data.tagline = bi("MAI MULTE LUMI. UN UNIVERS.", "MORE WORLDS. ONE UNIVERSE.");
    await db.update(sections).set({ data }).where(eq(sections.id, id));
    console.log("worlds: Calisthenics teaser, placeholder world appended, tagline set");
  }

  // ── mission: teaser on ──
  {
    const { id, data } = await loadRow<MissionData>("mission");
    data.teaser = true;
    await db.update(sections).set({ data }).where(eq(sections.id, id));
    console.log("mission: teaser=true");
  }

  console.log("done.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
