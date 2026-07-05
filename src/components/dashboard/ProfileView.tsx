import WalletButtons from "@/components/dashboard/WalletButtons";
import MemberQrCard from "@/components/dashboard/MemberQrCard";
import PricingCta from "@/components/site/PricingCta";
import ManageSubscription from "@/components/dashboard/ManageSubscription";
import AttendanceList from "@/components/dashboard/AttendanceList";
import SignOutButton from "@/components/dashboard/SignOutButton";
import DashboardTabBar from "@/components/dashboard/DashboardTabBar";

export type ProfileViewData = {
  name: string;
  initials: string;
  email: string;
  memberSince: string | null;
  tier: { name: string; level: number } | null;
  xp: number;
  wallet: { appleEnabled: boolean; googleEnabled: boolean; added: boolean };
  /** True when the member has an active PASS (gates the card + wallet). */
  passActive: boolean;
  /** Stripe price id of the PASS plan, for the in-account "activează" button. */
  passPriceId: string | null;
  /** In-app discount card (QR). Present only when the member has an active PASS. */
  qr: { token: string; origin: string } | null;
  activeSub: { planName: string | null; status: string; periodEnd: string | null } | null;
  creditsTotal: number;
  recentPayments: { id: string; label: string; amount: string }[];
  attendance: { slotId: string; slotDate: string; validatedAt: string; method: string }[];
};

export default function ProfileView({ data: d }: { data: ProfileViewData }) {
  return (
    <>
      <header className="m-hello">
        <div>
          <div className="m-hello-eyebrow">CONTUL TĂU</div>
          <h1 className="m-hello-name">Profil</h1>
        </div>
      </header>

      {/* ── Identity card ─────────────────────────────────────────────── */}
      <section className="m-prof-card">
        <div className="m-prof-avatar">{d.initials}</div>
        <div className="m-prof-id">
          <div className="m-prof-name">{d.name}</div>
          <div className="m-prof-email">{d.email}</div>
          {d.memberSince && (
            <div className="m-prof-since">Membru din {d.memberSince}</div>
          )}
        </div>
      </section>

      {/* ── Cardul de reduceri (QR) ───────────────────────────────────── */}
      {d.qr && (
        <section className="m-card-section" id="card">
          <div className="m-section-eyebrow">CARDUL TĂU · REDUCERI</div>
          <MemberQrCard origin={d.qr.origin} token={d.qr.token} />
          <p
            className="m-mini-meta"
            style={{ textAlign: "center", marginTop: "0.8rem" }}
          >
            Arată acest cod la partenerii MUEVE ca să primești reducerea.
          </p>
        </section>
      )}

      {/* ── Wallet ── members only (no active PASS → no card) ─────────────── */}
      {d.passActive && (d.wallet.appleEnabled || d.wallet.googleEnabled) && (
        <section className="m-card-section" id="wallet">
          <div className="m-section-eyebrow">WALLET DIGITAL</div>
          <WalletButtons
            appleEnabled={d.wallet.appleEnabled}
            googleEnabled={d.wallet.googleEnabled}
            initiallyAdded={d.wallet.added}
          />
        </section>
      )}

      {/* ── Pass + payments ───────────────────────────────────────────── */}
      <section className="m-card-section" id="pass">
        <div className="m-section-eyebrow">PASS · PLĂȚI</div>
        <div className="m-grid-2">
          <div className="m-mini-card">
            <div className="m-mini-label">PASS</div>
            {d.activeSub ? (
              <>
                <div className="m-mini-value">
                  {d.activeSub.planName || "Pass activ"}
                </div>
                <div className="m-mini-meta">
                  {d.activeSub.status.toUpperCase()}
                  {d.activeSub.periodEnd && ` · până la ${d.activeSub.periodEnd}`}
                </div>
                <div className="m-mini-meta">
                  {d.creditsTotal > 0
                    ? `${d.creditsTotal} ${d.creditsTotal === 1 ? "clasă rămasă" : "clase rămase"}`
                    : "Nicio clasă cumpărată."}
                </div>
                <ManageSubscription />
              </>
            ) : (
              <>
                <div className="m-mini-value">Fără Pass activ</div>
                {d.passPriceId ? (
                  <PricingCta
                    className="m-mini-link"
                    label="Activează PASS →"
                    priceId={d.passPriceId}
                    planId="plan-pass"
                    planName="PASS"
                    mode="subscription"
                  />
                ) : (
                  <a className="m-mini-link" href="/#pricing">
                    Vezi Pass-ul →
                  </a>
                )}
              </>
            )}
          </div>

          <div className="m-mini-card">
            <div className="m-mini-label">Plăți recente</div>
            {d.recentPayments.length === 0 ? (
              <div className="m-mini-meta">Încă nicio plată.</div>
            ) : (
              <ul className="m-mini-list">
                {d.recentPayments.map((p) => (
                  <li key={p.id} className="m-mini-row">
                    <span>{p.label}</span>
                    <span className="m-mini-amount">{p.amount}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {/* ── Attendance history ────────────────────────────────────────── */}
      <section className="m-card-section" id="history">
        <div className="m-section-eyebrow">ISTORIC PREZENȚE</div>
        <AttendanceList rows={d.attendance} />
      </section>

      <section className="m-card-section">
        <SignOutButton />
      </section>

      <DashboardTabBar active="profile" />
    </>
  );
}
