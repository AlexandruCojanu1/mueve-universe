import { auth } from "@/auth";
import { redirect } from "next/navigation";
import DashboardNav from "@/components/dashboard/DashboardNav";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login?from=/dashboard");
  return (
    <div className="admin-surface min-h-screen">
      <DashboardNav
        email={session.user.email ?? ""}
        name={session.user.name ?? undefined}
        role={session.user.role ?? "user"}
      />
      <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
