"use client";
import { useState } from "react";
import type { MissionData, MissionValue } from "@/lib/content-types";
import { BilingualInput, Card, Button } from "../fields";
import { Trash2, Plus } from "lucide-react";

export default function MissionEditor({ value, onChange }: { value: MissionData; onChange: (v: MissionData) => void }) {
  const [v, setV] = useState<MissionData>(value);
  const update = (patch: Partial<MissionData>) => {
    const next = { ...v, ...patch };
    setV(next);
    onChange(next);
  };
  const setVal = (i: number, mv: MissionValue) => {
    const values = v.values.slice();
    values[i] = mv;
    update({ values });
  };
  const remove = (i: number) => update({ values: v.values.filter((_, x) => x !== i) });
  const add = () =>
    update({
      values: [...v.values, { id: crypto.randomUUID(), title: { ro: "", en: "" }, body: { ro: "", en: "" } }],
    });

  return (
    <div className="space-y-5">
      <Card title="Antet">
        <BilingualInput
          label="Titlu rând 1 (opțional)"
          value={v.heading.lead}
          onChange={(lead) => update({ heading: { ...v.heading, lead } })}
        />
        <BilingualInput
          label="Titlu rând 2 (accent)"
          value={v.heading.accent}
          onChange={(accent) => update({ heading: { ...v.heading, accent } })}
        />
        <BilingualInput label="Descriere (text stânga)" value={v.intro} onChange={(intro) => update({ intro })} multiline rows={4} />
      </Card>

      <Card
        title={`Valori (${v.values.length})`}
        action={<Button size="sm" variant="secondary" onClick={add}><Plus size={12} className="inline mr-1" />Adaugă valoare</Button>}
      >
        <div className="space-y-4">
          {v.values.map((mv, i) => (
            <div key={mv.id} className="bg-white/5 border border-white/10 rounded-md p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs opacity-50 font-bold uppercase tracking-widest">Valoare #{i + 1}</span>
                <button onClick={() => remove(i)} className="text-white/40 hover:text-red-400">
                  <Trash2 size={14} />
                </button>
              </div>
              <BilingualInput label="Titlu" value={mv.title} onChange={(title) => setVal(i, { ...mv, title })} />
              <BilingualInput label="Descriere" value={mv.body} onChange={(body) => setVal(i, { ...mv, body })} multiline rows={3} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
