"use client";
import { useState } from "react";
import type { PricingData, PricingTier, PricingPlan } from "@/lib/content-types";
import { BilingualInput, Input, Label, Card, Button, Select } from "../fields";
import { Trash2, Plus } from "lucide-react";

const empty = { ro: "", en: "" };

export default function PricingEditor({ value, onChange }: { value: PricingData; onChange: (v: PricingData) => void }) {
  const [v, setV] = useState<PricingData>(value);
  const update = (patch: Partial<PricingData>) => {
    const next = { ...v, ...patch };
    setV(next);
    onChange(next);
  };

  const setTier = (i: number, t: PricingTier) => {
    const tiers = v.tiers.slice();
    tiers[i] = t;
    update({ tiers });
  };
  const removeTier = (i: number) => update({ tiers: v.tiers.filter((_, x) => x !== i) });
  const addTier = () =>
    update({
      tiers: [
        ...v.tiers,
        {
          id: crypto.randomUUID(),
          title: { ro: "NUME TIER", en: "TIER NAME" },
          subtitle: empty,
          plans: [newPlan()],
        },
      ],
    });

  return (
    <div className="space-y-5">
      <Card title="Antet">
        <BilingualInput
          label="Titlu rând 1"
          value={v.heading.lead}
          onChange={(lead) => update({ heading: { ...v.heading, lead } })}
        />
        <BilingualInput
          label="Titlu rând 2 (accent)"
          value={v.heading.accent}
          onChange={(accent) => update({ heading: { ...v.heading, accent } })}
        />
        <BilingualInput label="Intro" value={v.intro} onChange={(intro) => update({ intro })} multiline rows={2} />
        <BilingualInput
          label="Notă (sub prețuri, ex: discount cash)"
          value={v.note ?? empty}
          onChange={(note) => update({ note })}
          multiline
          rows={2}
        />
      </Card>

      <Card
        title={`Grupuri de prețuri (${v.tiers.length})`}
        action={
          <Button size="sm" variant="secondary" onClick={addTier}>
            <Plus size={12} className="inline mr-1" /> Adaugă grup
          </Button>
        }
      >
        <div className="space-y-6">
          {v.tiers.map((t, i) => (
            <TierEditor
              key={t.id}
              index={i}
              tier={t}
              onChange={(nt) => setTier(i, nt)}
              onRemove={() => removeTier(i)}
            />
          ))}
        </div>
      </Card>
    </div>
  );
}

function TierEditor({
  index,
  tier,
  onChange,
  onRemove,
}: {
  index: number;
  tier: PricingTier;
  onChange: (t: PricingTier) => void;
  onRemove: () => void;
}) {
  const setPlan = (i: number, p: PricingPlan) => {
    const plans = tier.plans.slice();
    plans[i] = p;
    onChange({ ...tier, plans });
  };
  const removePlan = (i: number) => onChange({ ...tier, plans: tier.plans.filter((_, x) => x !== i) });
  const addPlan = () => onChange({ ...tier, plans: [...tier.plans, newPlan()] });

  return (
    <div className="bg-white/5 border border-white/10 rounded-md p-4 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs opacity-50 font-bold uppercase tracking-widest">Grup #{index + 1}</span>
        <button onClick={onRemove} className="text-white/40 hover:text-red-400">
          <Trash2 size={14} />
        </button>
      </div>
      <BilingualInput label="Titlu grup" value={tier.title} onChange={(title) => onChange({ ...tier, title })} />
      <BilingualInput
        label="Subtitlu (opțional)"
        value={tier.subtitle ?? empty}
        onChange={(subtitle) => onChange({ ...tier, subtitle })}
      />
      <label className="flex items-center gap-2 text-sm opacity-80">
        <input
          type="checkbox"
          checked={!!tier.featured}
          onChange={(e) => onChange({ ...tier, featured: e.target.checked })}
        />
        Spotlight (card lat pe toată lățimea, layout 2 coloane)
      </label>
      <label className="flex items-center gap-2 text-sm opacity-80">
        <input
          type="checkbox"
          checked={!!tier.hidden}
          onChange={(e) => onChange({ ...tier, hidden: e.target.checked })}
        />
        Ascuns (nu apare pe site, dar rămâne salvat)
      </label>

      <div className="pt-2 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs opacity-70 font-bold uppercase tracking-widest">Planuri ({tier.plans.length})</span>
          <Button size="sm" variant="secondary" onClick={addPlan}>
            <Plus size={12} className="inline mr-1" /> Adaugă plan
          </Button>
        </div>
        {tier.plans.map((p, i) => (
          <PlanEditor
            key={p.id}
            index={i}
            plan={p}
            onChange={(np) => setPlan(i, np)}
            onRemove={() => removePlan(i)}
          />
        ))}
      </div>
    </div>
  );
}

function PlanEditor({
  index,
  plan,
  onChange,
  onRemove,
}: {
  index: number;
  plan: PricingPlan;
  onChange: (p: PricingPlan) => void;
  onRemove: () => void;
}) {
  const setFeature = (i: number, val: { ro: string; en: string }) => {
    const features = plan.features.slice();
    features[i] = val;
    onChange({ ...plan, features });
  };
  const removeFeature = (i: number) => onChange({ ...plan, features: plan.features.filter((_, x) => x !== i) });
  const addFeature = () => onChange({ ...plan, features: [...plan.features, { ro: "", en: "" }] });

  return (
    <div className="bg-black/30 border border-white/10 rounded-md p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] opacity-50 font-bold uppercase tracking-widest">Plan #{index + 1}</span>
        <button onClick={onRemove} className="text-white/40 hover:text-red-400">
          <Trash2 size={12} />
        </button>
      </div>
      <BilingualInput label="Nume plan" value={plan.name} onChange={(name) => onChange({ ...plan, name })} />
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Preț</Label>
          <Input value={plan.price} onChange={(price) => onChange({ ...plan, price })} placeholder="39.90" />
        </div>
        <div>
          <Label>Preț vechi (opțional)</Label>
          <Input
            value={plan.originalPrice ?? ""}
            onChange={(v) => onChange({ ...plan, originalPrice: v || undefined })}
            placeholder="59.90"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <BilingualInput label="Monedă" value={plan.currency} onChange={(currency) => onChange({ ...plan, currency })} />
        <BilingualInput
          label="Perioadă (opțional)"
          value={plan.period ?? empty}
          onChange={(period) => onChange({ ...plan, period })}
        />
      </div>
      <BilingualInput
        label="Tagline (opțional, ex: '4 clase')"
        value={plan.tagline ?? empty}
        onChange={(tagline) => onChange({ ...plan, tagline })}
      />
      <BilingualInput
        label="Badge (opțional, ex: 'REDUS', 'POPULAR')"
        value={plan.badge ?? empty}
        onChange={(badge) => onChange({ ...plan, badge })}
      />
      <BilingualInput
        label="Titlu listă features (opțional, ex: 'WHAT\u2019S INCLUDED?')"
        value={plan.featuresTitle ?? empty}
        onChange={(featuresTitle) => onChange({ ...plan, featuresTitle })}
      />

      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>Features ({plan.features.length})</Label>
          <Button size="sm" variant="secondary" onClick={addFeature}>
            <Plus size={10} className="inline mr-1" /> Adaugă
          </Button>
        </div>
        <div className="space-y-2">
          {plan.features.map((f, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="flex-1">
                <BilingualInput label={`Feature ${i + 1}`} value={f} onChange={(val) => setFeature(i, val)} />
              </div>
              <button onClick={() => removeFeature(i)} className="text-white/40 hover:text-red-400 pt-8">
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <BilingualInput
          label="CTA text (opțional)"
          value={plan.ctaLabel ?? empty}
          onChange={(ctaLabel) => onChange({ ...plan, ctaLabel })}
        />
        <div>
          <Label>CTA link (opțional)</Label>
          <Input
            value={plan.ctaHref ?? ""}
            onChange={(v) => onChange({ ...plan, ctaHref: v || undefined })}
            placeholder="#join"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm opacity-80">
        <input
          type="checkbox"
          checked={!!plan.highlighted}
          onChange={(e) => onChange({ ...plan, highlighted: e.target.checked })}
        />
        Evidențiat (galben)
      </label>

      <label className="flex items-center gap-2 text-sm opacity-80">
        <input
          type="checkbox"
          checked={plan.kind === "merch"}
          onChange={(e) => onChange({ ...plan, kind: e.target.checked ? "merch" : undefined })}
        />
        Merch (produs fizic, ex: tricou) — checkout cu livrare + mărime, fără cont/Pass
      </label>

      <div className="pt-3 mt-3 border-t border-white/10 space-y-3">
        <div className="text-[10px] opacity-50 font-bold uppercase tracking-widest">Stripe</div>
        {plan.kind === "merch" ? (
          <div className="text-xs opacity-60 leading-relaxed">
            Produsul de merch își provizionează singur prețul în Stripe la prima
            comandă — nu trebuie să completezi Price ID aici.
          </div>
        ) : (
        <div>
          <Label hint="Preia din Stripe Dashboard → Products → copiază Price ID (price_...)">Stripe Price ID</Label>
          <Input
            value={plan.stripePriceId ?? ""}
            onChange={(v) => onChange({ ...plan, stripePriceId: v || undefined })}
            placeholder="price_1ABCdefg..."
          />
        </div>
        )}
        {plan.kind !== "merch" && (
        <div>
          <Label>Tip checkout</Label>
          <Select
            value={plan.checkoutMode ?? "subscription"}
            onChange={(v) => onChange({ ...plan, checkoutMode: v })}
            options={[
              { value: "subscription", label: "Abonament recurent" },
              { value: "payment", label: "Plată unică" },
            ]}
          />
        </div>
        )}
      </div>
    </div>
  );
}

function newPlan(): PricingPlan {
  return {
    id: crypto.randomUUID(),
    name: { ro: "PLAN", en: "PLAN" },
    price: "0",
    currency: { ro: "lei", en: "RON" },
    features: [],
  };
}
