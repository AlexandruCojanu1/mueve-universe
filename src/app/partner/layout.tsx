import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { partners } from "@/db/schema";
import { eq } from "drizzle-orm";
import PartnerNav from "@/components/partner/PartnerNav";
import DashboardShell from "@/components/dashboard/DashboardShell";

export const dynamic = "force-dynamic";

export default async function PartnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?from=/partner");
  if (session.user.role !== "partner" && session.user.role !== "admin") {
    redirect("/dashboard");
  }

  const rows = await db
    .select()
    .from(partners)
    .where(eq(partners.userId, session.user.id))
    .limit(1);
  const p = rows[0];

  return (
    <DashboardShell
      nav={
        <PartnerNav
          email={session.user.email ?? ""}
          companyName={p?.companyName ?? "Partener"}
        />
      }
      variant="wide"
    >
      {children}
    </DashboardShell>
  );
}
