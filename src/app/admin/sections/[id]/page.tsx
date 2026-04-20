import { db } from "@/db";
import { sections } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import SectionEditor from "@/components/admin/SectionEditor";

export const dynamic = "force-dynamic";

export default async function EditSectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rows = await db.select().from(sections).where(eq(sections.id, id)).limit(1);
  const section = rows[0];
  if (!section) notFound();
  return <SectionEditor section={section} />;
}
