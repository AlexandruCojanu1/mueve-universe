import LaunchPanel from "@/components/admin/LaunchPanel";

export const dynamic = "force-dynamic";

export default function AdminLaunchPage() {
  return (
    <>
      <header className="dash-page-head">
        <div className="dash-page-eyebrow">Administrare</div>
        <h1 className="dash-page-title">Lansare</h1>
        <p className="dash-page-sub">
          Pune site-ul pe ecranul de pre-lansare, pornește numărătoarea inversă
          și extrage câștigătorii tombolei.
        </p>
      </header>
      <LaunchPanel />
    </>
  );
}
