import PartnerScanner from "@/components/partner/PartnerScanner";

export const dynamic = "force-dynamic";

export default function PartnerScanPage() {
  return (
    <>
      <header className="dash-page-head">
        <div className="dash-page-eyebrow">Scanner partener</div>
        <h1 className="dash-page-title">Validează QR</h1>
        <p className="dash-page-sub">
          Îndreaptă camera spre QR-ul membrului. Rezultatul apare în dreapta.
        </p>
      </header>
      <PartnerScanner />
    </>
  );
}
