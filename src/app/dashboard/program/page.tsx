import { redirect } from "next/navigation";
import { auth } from "@/auth";
import ReserveBoard from "@/components/dashboard/ReserveBoard";
import DashboardTabBar from "@/components/dashboard/DashboardTabBar";

export const dynamic = "force-dynamic";

export default async function ProgramPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?from=/dashboard/program");

  return (
    <>
      <header className="m-hello">
        <div>
          <div className="m-hello-eyebrow">CALENDAR</div>
          <h1 className="m-hello-name">Rezervă o sesiune</h1>
        </div>
      </header>

      <ReserveBoard />

      <a className="m-fullprog-link" href="/#prog">
        Vezi calendarul complet pe site →
      </a>

      <DashboardTabBar active="program" />
    </>
  );
}
