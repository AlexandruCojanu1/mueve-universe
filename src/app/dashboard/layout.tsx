import { auth } from "@/auth";
import { redirect } from "next/navigation";
import DashboardNav from "@/components/dashboard/DashboardNav";
import DashboardShell from "@/components/dashboard/DashboardShell";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login?from=/dashboard");
  return (
    <DashboardShell
      nav={
        <DashboardNav
          email={session.user.email ?? ""}
          name={session.user.name ?? undefined}
          role={session.user.role ?? "user"}
        />
      }
    >
      {children}
    </DashboardShell>
  );
}
