import { redirect } from "next/navigation";
import { db } from "@/db";
import { sections } from "@/db/schema";
import { asc } from "drizzle-orm";
import SiteShell from "@/components/site/SiteShell";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Home() {
  // Authenticated members shouldn't land on the marketing page — bounce
  // them to their dashboard based on role.
  const session = await auth();
  if (session?.user) {
    const role = (session.user as { role?: string }).role;
    if (role === "admin") redirect("/admin");
    if (role === "partner") redirect("/partner");
    if (role === "coach") redirect("/coach");
    redirect("/dashboard");
  }

  const rows = await db.select().from(sections).orderBy(asc(sections.order));
  return <SiteShell sections={rows} />;
}
