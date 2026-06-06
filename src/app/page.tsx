import { redirect } from "next/navigation";
import { db } from "@/db";
import { sections, appSettings } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
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
  const [launchRow] = await db
    .select({ value: appSettings.value })
    .from(appSettings)
    .where(eq(appSettings.key, "launch"))
    .limit(1);
  const launch = (launchRow?.value as { state: "pre" | "countdown" | "live"; startAt?: string }) ?? {
    state: "live" as const,
  };
  // Content version: lets open clients soft-refresh when admin edits content.
  const v = rows.reduce((m, r) => Math.max(m, r.updatedAt?.getTime() ?? 0), 0);
  return <SiteShell sections={rows} launch={{ ...launch, v }} />;
}
