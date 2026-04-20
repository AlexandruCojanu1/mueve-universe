import SessionProvider from "@/components/SessionProvider";
import AdminNav from "@/components/admin/AdminNav";
import { auth } from "@/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  return (
    <SessionProvider session={session}>
      <div className="admin-surface">
        {session && <AdminNav email={session.user?.email ?? ""} />}
        <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
      </div>
    </SessionProvider>
  );
}
