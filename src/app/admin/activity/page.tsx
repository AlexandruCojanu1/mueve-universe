import ActivityBoard from "@/components/admin/ActivityBoard";

export const dynamic = "force-dynamic";

export default function AdminActivityPage() {
  return (
    <>
      <header className="dash-page-head">
        <div className="dash-page-eyebrow">Administrare</div>
        <h1 className="dash-page-title">Prezențe & activitate</h1>
        <p className="dash-page-sub">
          Check-in-uri recente, volum pe ultimele săptămâni și clasamentul XP.
        </p>
      </header>
      <ActivityBoard />
    </>
  );
}
