"use client";
import { useState } from "react";
import type { JoinData } from "@/lib/content-types";
import { BilingualInput, Card } from "../fields";

export default function JoinEditor({ value, onChange }: { value: JoinData; onChange: (v: JoinData) => void }) {
  const [v, setV] = useState<JoinData>(value);
  const update = (patch: Partial<JoinData>) => {
    const next = { ...v, ...patch };
    setV(next);
    onChange(next);
  };
  return (
    <div className="space-y-5">
      <Card title="Titlu">
        <BilingualInput label="Rând 1" value={v.heading.lead} onChange={(lead) => update({ heading: { ...v.heading, lead } })} />
        <BilingualInput label="Rând 2 (accent)" value={v.heading.accent} onChange={(accent) => update({ heading: { ...v.heading, accent } })} />
      </Card>
      <Card title="Formular">
        <BilingualInput label="Descriere" value={v.body} onChange={(body) => update({ body })} multiline rows={3} />
        <BilingualInput label="Placeholder email" value={v.emailPlaceholder} onChange={(emailPlaceholder) => update({ emailPlaceholder })} />
        <BilingualInput label="Buton submit" value={v.submitLabel} onChange={(submitLabel) => update({ submitLabel })} />
      </Card>
    </div>
  );
}
