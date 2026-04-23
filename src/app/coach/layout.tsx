import { auth } from "@/auth";
import { redirect } from "next/navigation";
import CoachNav from "@/components/coach/CoachNav";
import DashboardShell from "@/components/dashboard/DashboardShell";

export const dynamic = "force-dynamic";

export default async function CoachLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const role = session?.user?.role;
  if (!session?.user) redirect("/login?from=/coach");
  if (role === "admin") redirect("/admin");
  if (role !== "coach") redirect("/dashboard");
  return (
    <DashboardShell
      variant="narrow"
      nav={
        <CoachNav
          email={session.user.email ?? ""}
          name={session.user.name ?? undefined}
          role={role}
        />
      }
    >
      {children}
    </DashboardShell>
  );
}
