"use client";
import { useEffect } from "react";
import { useLang } from "@/lib/lang-context";
import { pick, splitTeaser } from "@/lib/bilingual";
import type { PricingPlan } from "@/lib/content-types";
import PricingCta from "./PricingCta";

type Props = {
  plan: PricingPlan;
  onClose: () => void;
};

export default function PricingDetailsModal({ plan, onClose }: Props) {
  const { lang } = useLang();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  const name = pick(plan.name, lang);
  const currency = pick(plan.currency, lang);
  const period = plan.period ? pick(plan.period, lang) : "";
  const tagline = plan.tagline ? pick(plan.tagline, lang) : "";
  const featuresTitle = plan.featuresTitle ? pick(plan.featuresTitle, lang) : "";
  const ctaLabel = plan.ctaLabel ? pick(plan.ctaLabel, lang) : "";
  const badge = plan.badge ? pick(plan.badge, lang) : "";

  return (
    <div className="pricing-modal-backdrop" onClick={onClose}>
      {/* Close lives on the backdrop (not inside the scrollable card) so it's
          always reachable on mobile even when the card scrolls. */}
      <button className="pricing-modal-close" onClick={onClose} aria-label="Închide">
        ×
      </button>
      <div
        className="pricing-modal"
        role="dialog"
        aria-modal="true"
        aria-label={name}
        data-lenis-prevent
        onClick={(e) => e.stopPropagation()}
      >
        {badge && <div className="pricing-modal-badge">{badge}</div>}
        <div className="pricing-modal-name">{name}</div>
        <div className="pricing-modal-price">
          <span className="pricing-modal-amount">{plan.price}</span>
          {currency && <span className="pricing-modal-currency">{currency}</span>}
        </div>
        {plan.originalPrice && (
          <div className="pricing-modal-original">{plan.originalPrice}</div>
        )}
        {period && <div className="pricing-modal-period">{period}</div>}
        {tagline && <div className="pricing-modal-tagline">{tagline}</div>}
        {plan.features.length > 0 && (
          <div className="pricing-modal-feat">
            {featuresTitle && (
              <div className="pricing-modal-feat-title">{featuresTitle}</div>
            )}
            <ul>
              {plan.features.map((f, i) => {
                const { prefix, blur } = splitTeaser(pick(f, lang));
                return (
                  <li key={i}>
                    {prefix}
                    {blur && <span className="teaser-blur">{blur}</span>}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
        {ctaLabel && (
          <PricingCta
            className="pricing-modal-cta"
            label={ctaLabel}
            priceId={plan.stripePriceId}
            planId={plan.id}
            planName={name}
            mode={plan.checkoutMode}
            kind={plan.kind}
            fallbackHref={plan.ctaHref || "#join"}
          />
        )}
      </div>
    </div>
  );
}
