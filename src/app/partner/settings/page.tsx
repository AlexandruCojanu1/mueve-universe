import PartnerSettingsForm from "@/components/partner/PartnerSettingsForm";

export const dynamic = "force-dynamic";

export default function PartnerSettingsPage() {
  return (
    <>
      <header className="dash-page-head">
        <div className="dash-page-eyebrow">Partener</div>
        <h1 className="dash-page-title">Setări profil</h1>
        <p className="dash-page-sub">
          Actualizează numele firmei, descrierea reducerii și logo-ul.
        </p>
      </header>
      <PartnerSettingsForm />
    </>
  );
}
