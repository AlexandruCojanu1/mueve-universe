import { auth } from "@/auth";
import { redirect } from "next/navigation";
import CoachNav from "@/components/coach/CoachNav";

export const dynamic = "force-dynamic";

export default async function CoachLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const role = session?.user?.role;
  if (!session?.user) redirect("/login?from=/coach");
  if (role !== "coach" && role !== "admin") redirect("/dashboard");
  return (
    <div className="admin-surface min-h-screen">
      <CoachNav email={session.user.email ?? ""} name={session.user.name ?? undefined} role={role} />
      <main className="max-w-5xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
