import SlotsManager from "@/components/admin/SlotsManager";

export const dynamic = "force-dynamic";

export default function AdminSlotsPage() {
  return (
    <>
      <header className="dash-page-head">
        <div className="dash-page-eyebrow">Administrare</div>
        <h1 className="dash-page-title">Calendar clase</h1>
        <p className="dash-page-sub">
          Atribuie ore fiecărui coach. Coach-ul vede în zona lui doar slot-urile
          asignate lui.
        </p>
      </header>
      <SlotsManager />
    </>
  );
}
