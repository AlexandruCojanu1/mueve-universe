import { redirect } from "next/navigation";
import SessionProvider from "@/components/SessionProvider";
import AdminNav from "@/components/admin/AdminNav";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { auth } from "@/auth";

const ROLE_HOME: Record<string, string> = {
  partner: "/partner",
  coach: "/coach",
  user: "/dashboard",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const role = session?.user?.role;
  if (session && role !== "admin") {
    redirect(ROLE_HOME[role ?? "user"] ?? "/dashboard");
  }
  return (
    <SessionProvider session={session}>
      <DashboardShell
        nav={session ? <AdminNav email={session.user?.email ?? ""} /> : null}
        variant="wide"
      >
        {children}
      </DashboardShell>
    </SessionProvider>
  );
}
