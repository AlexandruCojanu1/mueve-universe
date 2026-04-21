import UsersManager from "@/components/admin/UsersManager";

export const dynamic = "force-dynamic";

export default function AdminUsersPage() {
  return (
    <>
      <header className="dash-page-head">
        <div className="dash-page-eyebrow">Administrare</div>
        <h1 className="dash-page-title">Useri & roluri</h1>
        <p className="dash-page-sub">
          Schimbă rolul unui user — user, coach, admin, partener. Pentru
          partener creează întâi profilul firmei din{" "}
          <strong>Parteneri</strong>.
        </p>
      </header>
      <UsersManager />
    </>
  );
}
