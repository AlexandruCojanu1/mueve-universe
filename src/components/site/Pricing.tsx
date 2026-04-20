"use client";
import { useLang } from "@/lib/lang-context";
import { pick } from "@/lib/bilingual";
import type { PricingData, PricingPlan, PricingTier } from "@/lib/content-types";
import type { CSSProperties } from "react";
import PricingCta from "./PricingCta";

export default function Pricing({ data }: { data: PricingData }) {
  const { lang } = useLang();
  return (
    <section className="pricing" id="pricing">
      <div className="pricing-head">
        <h2>
          {pick(data.heading.lead, lang)}
          <br />
          <span>{pick(data.heading.accent, lang)}</span>
        </h2>
        {pick(data.intro, lang) && <p>{pick(data.intro, lang)}</p>}
      </div>
      <div className="pricing-tiers">
        {data.tiers.map((tier) => (
          <TierBlock key={tier.id} tier={tier} />
        ))}
      </div>
      {data.note && pick(data.note, lang) && (
        <div className="pricing-note">
          <span className="pricing-note-mark">*</span>
          {pick(data.note, lang)}
        </div>
      )}
    </section>
  );
}

function TierBlock({ tier }: { tier: PricingTier }) {
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
      <div className={"price-cards" + (count > 1 ? " price-cards-grid" : "")} style={gridStyle}>
        {tier.plans.map((p) => (
          <PlanCard key={p.id} plan={p} featured={tier.featured && count === 1} />
        ))}
      </div>
    </div>
  );
}

function PlanCard({ plan, featured }: { plan: PricingPlan; featured?: boolean }) {
  const { lang } = useLang();
  const name = pick(plan.name, lang);
  const tagline = plan.tagline ? pick(plan.tagline, lang) : "";
  const period = plan.period ? pick(plan.period, lang) : "";
  const currency = pick(plan.currency, lang);
  const featuresTitle = plan.featuresTitle ? pick(plan.featuresTitle, lang) : "";
  const badge = plan.badge ? pick(plan.badge, lang) : "";
  const ctaLabel = plan.ctaLabel ? pick(plan.ctaLabel, lang) : "";

  const cls =
    "price-card" +
    (plan.highlighted ? " price-card-hl" : "") +
    (featured ? " price-card-featured" : "");

  return (
    <div className={cls}>
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
      {plan.features.length > 0 && (
        <div className="price-card-feat">
          {featuresTitle && <div className="price-feat-title">{featuresTitle}</div>}
          <ul className="price-feat">
            {plan.features.map((f, i) => (
              <li key={i}>{pick(f, lang)}</li>
            ))}
          </ul>
        </div>
      )}
      {ctaLabel && (
        <PricingCta
          className="price-cta"
          label={ctaLabel}
          priceId={plan.stripePriceId}
          planId={plan.id}
          planName={pick(plan.name, lang)}
          mode={plan.checkoutMode}
          fallbackHref={plan.ctaHref || "#join"}
        />
      )}
    </div>
  );
}
