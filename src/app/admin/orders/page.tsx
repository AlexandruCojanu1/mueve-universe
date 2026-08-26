import OrdersBoard from "@/components/admin/OrdersBoard";

export const dynamic = "force-dynamic";

export default function AdminOrdersPage() {
  return (
    <>
      <header className="dash-page-head">
        <div className="dash-page-eyebrow">Administrare</div>
        <h1 className="dash-page-title">Comenzi</h1>
        <p className="dash-page-sub">
          Comenzile de merch din Stripe: client, mărime, adresă de livrare și statusul expedierii.
        </p>
      </header>
      <OrdersBoard />
    </>
  );
}
