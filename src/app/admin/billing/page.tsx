import BillingBoard from "@/components/admin/BillingBoard";

export const dynamic = "force-dynamic";

export default function AdminBillingPage() {
  return (
    <>
      <header className="dash-page-head">
        <div className="dash-page-eyebrow">Administrare</div>
        <h1 className="dash-page-title">Abonamente & plăți</h1>
        <p className="dash-page-sub">
          Pass-uri active, credite de clasă și istoricul plăților Stripe.
        </p>
      </header>
      <BillingBoard />
    </>
  );
}
