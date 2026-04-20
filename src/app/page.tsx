import { db } from "@/db";
import { sections } from "@/db/schema";
import { asc } from "drizzle-orm";
import SiteShell from "@/components/site/SiteShell";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Home() {
  const rows = await db.select().from(sections).orderBy(asc(sections.order));
  return <SiteShell sections={rows} />;
}
