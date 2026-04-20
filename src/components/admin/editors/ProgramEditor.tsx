"use client";
import { useState } from "react";
import type { ProgramData, ProgramSlot } from "@/lib/content-types";
import { BilingualInput, Input, Label, Card, Button, Select } from "../fields";
import { Trash2, Plus } from "lucide-react";

const DAY_NAMES = ["Luni", "Marți", "Miercuri", "Joi", "Vineri", "Sâmbătă", "Duminică"];

export default function ProgramEditor({ value, onChange }: { value: ProgramData; onChange: (v: ProgramData) => void }) {
  const [v, setV] = useState<ProgramData>(value);
  const update = (patch: Partial<ProgramData>) => {
    const next = { ...v, ...patch };
    setV(next);
    onChange(next);
  };
  const setSlot = (i: number, s: ProgramSlot) => {
    const slots = v.slots.slice();
    slots[i] = s;
    update({ slots });
  };
  const removeSlot = (i: number) => update({ slots: v.slots.filter((_, x) => x !== i) });
  const addSlot = () =>
    update({
      slots: [
        ...v.slots,
        {
          id: crypto.randomUUID(),
          day: 0,
          row: "pm",
          activity: { ro: "", en: "" },
          time: "19:00",
          world: { ro: "", en: "" },
          color: "blue",
        },
      ],
    });

  const setDayLabel = (i: number, val: { ro: string; en: string }) => {
    const labels = v.dayLabels.slice();
    labels[i] = val;
    update({ dayLabels: labels });
  };

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
          label="Text buton modal (Join mission)"
          value={v.joinLabel}
          onChange={(joinLabel) => update({ joinLabel })}
        />
      </Card>

      <Card title="Etichete zile">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {v.dayLabels.map((d, i) => (
            <BilingualInput
              key={i}
              label={DAY_NAMES[i]}
              value={d}
              onChange={(val) => setDayLabel(i, val)}
            />
          ))}
        </div>
      </Card>

      <Card title="Etichete rânduri">
        <BilingualInput
          label="Dimineața"
          value={v.rowLabels.am}
          onChange={(am) => update({ rowLabels: { ...v.rowLabels, am } })}
        />
        <BilingualInput
          label="Seara"
          value={v.rowLabels.pm}
          onChange={(pm) => update({ rowLabels: { ...v.rowLabels, pm } })}
        />
      </Card>

      <Card
        title={`Sesiuni (${v.slots.length})`}
        action={<Button size="sm" variant="secondary" onClick={addSlot}><Plus size={12} className="inline mr-1" />Adaugă sesiune</Button>}
      >
        <div className="space-y-4">
          {v.slots.map((s, i) => (
            <div key={s.id} className="bg-white/5 border border-white/10 rounded-md p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs opacity-50 font-bold uppercase tracking-widest">Sesiune #{i + 1}</span>
                <button onClick={() => removeSlot(i)} className="text-white/40 hover:text-red-400">
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <Label>Zi</Label>
                  <Select<"0" | "1" | "2" | "3" | "4" | "5" | "6">
                    value={String(s.day) as "0" | "1" | "2" | "3" | "4" | "5" | "6"}
                    onChange={(v) => setSlot(i, { ...s, day: Number(v) as ProgramSlot["day"] })}
                    options={DAY_NAMES.map((n, x) => ({ value: String(x) as "0" | "1" | "2" | "3" | "4" | "5" | "6", label: n }))}
                  />
                </div>
                <div>
                  <Label>Rând</Label>
                  <Select
                    value={s.row}
                    onChange={(row) => setSlot(i, { ...s, row })}
                    options={[
                      { value: "am", label: "Dimineața" },
                      { value: "pm", label: "Seara" },
                    ]}
                  />
                </div>
                <div>
                  <Label>Oră</Label>
                  <Input value={s.time} onChange={(time) => setSlot(i, { ...s, time })} placeholder="18:30" />
                </div>
                <div>
                  <Label>Culoare</Label>
                  <Select
                    value={s.color}
                    onChange={(color) => setSlot(i, { ...s, color })}
                    options={[
                      { value: "yellow", label: "Galben (sun)" },
                      { value: "purple", label: "Mov (temple)" },
                      { value: "blue", label: "Albastru (forge)" },
                      { value: "orange", label: "Portocaliu (sanctuary)" },
                    ]}
                  />
                </div>
              </div>
              <BilingualInput label="Activitate" value={s.activity} onChange={(activity) => setSlot(i, { ...s, activity })} />
              <BilingualInput label="Lume" value={s.world} onChange={(world) => setSlot(i, { ...s, world })} />
              <div>
                <Label>Badge &apos;Main Event&apos;</Label>
                <label className="flex items-center gap-2 text-sm opacity-80">
                  <input type="checkbox" checked={!!s.boss} onChange={(e) => setSlot(i, { ...s, boss: e.target.checked })} />
                  Marcaj &quot;MAIN EVENT&quot;
                </label>
              </div>
              <BilingualInput
                label="Descriere (modal detalii)"
                value={s.description ?? { ro: "", en: "" }}
                onChange={(description) => setSlot(i, { ...s, description })}
                multiline
                rows={3}
              />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
