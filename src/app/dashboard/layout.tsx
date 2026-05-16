import { auth } from "@/auth";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/dashboard/DashboardShell";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login?from=/dashboard");
  // No top nav — the gamified dashboard has its own header + bottom tab bar.
  // Sign-out is exposed via the avatar menu inside the page.
  return <DashboardShell nav={null}>{children}</DashboardShell>;
}
