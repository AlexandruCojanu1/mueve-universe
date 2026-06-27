"use client";
import { useState } from "react";
import { useLang } from "@/lib/lang-context";
import { pick } from "@/lib/bilingual";
import type { PricingData, PricingPlan, PricingTier } from "@/lib/content-types";
import type { CSSProperties } from "react";
import PricingDetailsModal from "./PricingDetailsModal";
import PassCountdown from "./PassCountdown";
import CtaPair from "./CtaPair";

export default function Pricing({ data }: { data: PricingData }) {
  const { lang } = useLang();
  const [openPlan, setOpenPlan] = useState<PricingPlan | null>(null);

  // Render the intro as separate left-aligned paragraphs: split on explicit
  // line breaks first, then on sentence boundaries, so "Alergăm împreună
  // gratuit. Construim împreună mai departe." becomes two distinct lines.
  const introParas = pick(data.intro, lang)
    .split(/\n+/)
    .flatMap((s) => s.trim().split(/(?<=\.)\s+/))
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <section className="pricing" id="pricing">
      <div className="pricing-head">
        <h2>
          {pick(data.heading.lead, lang)}
          <br />
          <span>{pick(data.heading.accent, lang)}</span>
        </h2>
        {introParas.length > 0 && (
          <div className="pricing-intro">
            {introParas.map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        )}
        <CtaPair />
        <PassCountdown />
      </div>
      <div className="pricing-tiers">
        {data.tiers.map((tier) => (
          <TierBlock key={tier.id} tier={tier} onOpen={setOpenPlan} />
        ))}
      </div>
      <div className="pricing-cta-hint">
        {lang === "ro"
          ? "Click pe un card pentru toate beneficiile"
          : "Click any card for full benefits"}
      </div>
      {data.note && pick(data.note, lang) && (
        <div className="pricing-note">
          <span className="pricing-note-mark">*</span>
          {pick(data.note, lang)}
        </div>
      )}
      {openPlan && (
        <PricingDetailsModal plan={openPlan} onClose={() => setOpenPlan(null)} />
      )}
    </section>
  );
}

function TierBlock({
  tier,
  onOpen,
}: {
  tier: PricingTier;
  onOpen: (p: PricingPlan) => void;
}) {
  const { lang } = useLang();
  const count = tier.plans.length;
  const classes = [
    "price-tier",
    count > 1 ? "price-tier-multi" : "",
    tier.featured ? "price-tier-featured" : "",
  ]
    .filter(Boolean)
    .join(" ");
  const gridStyle = { "--col-count": count } as CSSProperties;

  return (
    <div className={classes}>
      <div className="price-tier-head">
        <h3>{pick(tier.title, lang)}</h3>
        {tier.subtitle && pick(tier.subtitle, lang) && (
          <p>{pick(tier.subtitle, lang)}</p>
        )}
      </div>
      <div
        className={"price-cards" + (count > 1 ? " price-cards-grid" : "")}
        style={gridStyle}
      >
        {tier.plans.map((p) => (
          <PlanCard
            key={p.id}
            plan={p}
            featured={tier.featured && count === 1}
            onOpen={onOpen}
          />
        ))}
      </div>
    </div>
  );
}

function PlanCard({
  plan,
  featured,
  onOpen,
}: {
  plan: PricingPlan;
  featured?: boolean;
  onOpen: (p: PricingPlan) => void;
}) {
  const { lang } = useLang();
  const name = pick(plan.name, lang);
  const tagline = plan.tagline ? pick(plan.tagline, lang) : "";
  const period = plan.period ? pick(plan.period, lang) : "";
  const currency = pick(plan.currency, lang);
  const badge = plan.badge ? pick(plan.badge, lang) : "";

  const cls =
    "price-card price-card-compact" +
    (plan.highlighted ? " price-card-hl" : "") +
    (featured ? " price-card-featured" : "");

  return (
    <button
      type="button"
      className={cls}
      onClick={() => onOpen(plan)}
      aria-label={`${name} — vezi detalii`}
    >
      {badge && <div className="price-badge">{badge}</div>}
      <div className="price-card-main">
        {name && <div className="price-name">{name}</div>}
        <div className="price-amount">
          <span className="price-value">{plan.price}</span>
          {currency && <span className="price-currency">{currency}</span>}
        </div>
        {plan.originalPrice && (
          <div className="price-original">{plan.originalPrice}</div>
        )}
        {period && <div className="price-period">{period}</div>}
        {tagline && <div className="price-tagline">{tagline}</div>}
      </div>
      <div className="price-card-hint">
        {lang === "ro" ? "Vezi beneficii →" : "See benefits →"}
      </div>
    </button>
  );
}
