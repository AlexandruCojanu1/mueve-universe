import SessionProvider from "@/components/SessionProvider";
import AdminNav from "@/components/admin/AdminNav";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { auth } from "@/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
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
