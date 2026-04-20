"use client";
import { useState } from "react";
import type { StatsData, StatItem } from "@/lib/content-types";
import { BilingualInput, Card, Button } from "../fields";
import { Trash2, Plus } from "lucide-react";

const empty = { ro: "", en: "" };

export default function StatsEditor({ value, onChange }: { value: StatsData; onChange: (v: StatsData) => void }) {
  const [v, setV] = useState<StatsData>(value);
  const update = (patch: Partial<StatsData>) => {
    const next = { ...v, ...patch };
    setV(next);
    onChange(next);
  };
  const setItem = (i: number, s: StatItem) => {
    const items = v.items.slice();
    items[i] = s;
    update({ items });
  };
  const removeItem = (i: number) => update({ items: v.items.filter((_, x) => x !== i) });
  const addItem = () =>
    update({
      items: [
        ...v.items,
        { id: crypto.randomUUID(), value: { ro: "0", en: "0" }, label: empty },
      ],
    });

  return (
    <div className="space-y-5">
      <Card title="Antet">
        <BilingualInput
          label="Eyebrow (text mic sus, ex: COMMUNITY)"
          value={v.eyebrow ?? empty}
          onChange={(eyebrow) => update({ eyebrow })}
        />
        <BilingualInput
          label="Titlu (opțional)"
          value={v.heading ?? empty}
          onChange={(heading) => update({ heading })}
        />
      </Card>

      <Card
        title={`Statistici (${v.items.length})`}
        action={
          <Button size="sm" variant="secondary" onClick={addItem}>
            <Plus size={12} className="inline mr-1" /> Adaugă
          </Button>
        }
      >
        <div className="space-y-4">
          {v.items.map((s, i) => (
            <div key={s.id} className="bg-white/5 border border-white/10 rounded-md p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs opacity-50 font-bold uppercase tracking-widest">Stat #{i + 1}</span>
                <button onClick={() => removeItem(i)} className="text-white/40 hover:text-red-400">
                  <Trash2 size={14} />
                </button>
              </div>
              <BilingualInput
                label="Valoare (ex: 40%, 15+, 0, 100%)"
                value={s.value}
                onChange={(value) => setItem(i, { ...s, value })}
              />
              <BilingualInput
                label="Etichetă (ex: Monthly growth)"
                value={s.label}
                onChange={(label) => setItem(i, { ...s, label })}
              />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
