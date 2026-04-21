import PartnersManager from "@/components/admin/PartnersManager";

export const dynamic = "force-dynamic";

export default function AdminPartnersPage() {
  return (
    <>
      <header className="dash-page-head">
        <div className="dash-page-eyebrow">Administrare</div>
        <h1 className="dash-page-title">Parteneri & reduceri</h1>
        <p className="dash-page-sub">
          Adaugă firmele care oferă reduceri membrilor Mueve. Fiecare primește
          un cont de partener ca să valideze QR-urile.
        </p>
      </header>
      <PartnersManager />
    </>
  );
}
