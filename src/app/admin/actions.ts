"use server";
import { auth } from "@/auth";
import { db } from "@/db";
import { sections, theme } from "@/db/schema";
import { eq, asc, desc, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { defaultDataForType } from "@/lib/default-data";
import type { SectionType } from "@/lib/content-types";
import { syncClassSlotsFromProgram } from "@/lib/sync-class-slots";

async function requireAuth() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
}

function bumpAll() {
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function addSection(type: SectionType, afterOrder?: number) {
  await requireAuth();
  const data = defaultDataForType(type);
  if (afterOrder !== undefined) {
    await db
      .update(sections)
      .set({ order: sql`${sections.order} + 1` })
      .where(sql`${sections.order} > ${afterOrder}`);
    const [row] = await db
      .insert(sections)
      .values({ type, order: afterOrder + 1, visible: true, data })
      .returning();
    bumpAll();
    return row;
  }
  const last = await db.select().from(sections).orderBy(desc(sections.order)).limit(1);
  const nextOrder = last[0] ? last[0].order + 1 : 0;
  const [row] = await db
    .insert(sections)
    .values({ type, order: nextOrder, visible: true, data })
    .returning();
  bumpAll();
  return row;
}

export async function deleteSection(id: string) {
  await requireAuth();
  await db.delete(sections).where(eq(sections.id, id));
  bumpAll();
}

export async function toggleVisibility(id: string) {
  await requireAuth();
  const rows = await db.select().from(sections).where(eq(sections.id, id)).limit(1);
  if (!rows[0]) return;
  await db
    .update(sections)
    .set({ visible: !rows[0].visible, updatedAt: new Date() })
    .where(eq(sections.id, id));
  bumpAll();
}

export async function duplicateSection(id: string) {
  await requireAuth();
  const rows = await db.select().from(sections).where(eq(sections.id, id)).limit(1);
  const src = rows[0];
  if (!src) return;
  await db
    .update(sections)
    .set({ order: sql`${sections.order} + 1` })
    .where(sql`${sections.order} > ${src.order}`);
  await db
    .insert(sections)
    .values({ type: src.type, order: src.order + 1, visible: src.visible, data: src.data });
  bumpAll();
}

export async function reorderSections(orderedIds: string[]) {
  await requireAuth();
  for (let i = 0; i < orderedIds.length; i++) {
    await db
      .update(sections)
      .set({ order: i, updatedAt: new Date() })
      .where(eq(sections.id, orderedIds[i]));
  }
  bumpAll();
}

export async function updateSectionData(id: string, data: Record<string, unknown>) {
  await requireAuth();
  const [row] = await db
    .update(sections)
    .set({ data, updatedAt: new Date() })
    .where(eq(sections.id, id))
    .returning({ type: sections.type });
  bumpAll();
  // Keep the bookable dashboard calendar in sync with the public programme.
  if (row?.type === "program") {
    try {
      await syncClassSlotsFromProgram();
      revalidatePath("/dashboard/program");
    } catch (e) {
      console.error("[updateSectionData] class-slot sync failed:", e);
    }
  }
}

export async function updateTheme(colors: Record<string, string>, fonts: { heading: string; body: string }) {
  await requireAuth();
  await db
    .update(theme)
    .set({ colors, fonts, updatedAt: new Date() })
    .where(eq(theme.id, "default"));
  revalidatePath("/", "layout");
  revalidatePath("/admin/theme");
}

export async function listSections() {
  await requireAuth();
  return db.select().from(sections).orderBy(asc(sections.order));
}
