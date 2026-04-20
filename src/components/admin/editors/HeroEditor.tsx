"use client";
import { useState } from "react";
import type { HeroData } from "@/lib/content-types";
import { BilingualInput, Card } from "../fields";

export default function HeroEditor({ value, onChange }: { value: HeroData; onChange: (v: HeroData) => void }) {
  const [v, setV] = useState<HeroData>(value);
  const update = (patch: Partial<HeroData>) => {
    const next = { ...v, ...patch };
    setV(next);
    onChange(next);
  };
  return (
    <div className="space-y-5">
      <Card title="Titlu (3 rânduri)">
        <BilingualInput label="Rând 1 (sus)" value={v.headingTop} onChange={(headingTop) => update({ headingTop })} />
        <BilingualInput label="Rând 2 (accent galben)" value={v.headingAccent} onChange={(headingAccent) => update({ headingAccent })} />
        <BilingualInput label="Rând 3 (jos)" value={v.headingBottom} onChange={(headingBottom) => update({ headingBottom })} />
      </Card>
      <Card title="Subtitlu">
        <BilingualInput label="Text" value={v.sub} onChange={(sub) => update({ sub })} multiline rows={3} />
      </Card>
    </div>
  );
}
