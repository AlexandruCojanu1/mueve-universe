"use client";
import { useState } from "react";
import type { WorldsData, WorldCard, Bilingual } from "@/lib/content-types";
import { BilingualInput, Input, Label, Card, Button, Select } from "../fields";
import { Trash2, Plus } from "lucide-react";

export default function WorldsEditor({ value, onChange }: { value: WorldsData; onChange: (v: WorldsData) => void }) {
  const [v, setV] = useState<WorldsData>(value);
  const update = (patch: Partial<WorldsData>) => {
    const next = { ...v, ...patch };
    setV(next);
    onChange(next);
  };
  const updateCard = (i: number, card: WorldCard) => {
    const worlds = v.worlds.slice();
    worlds[i] = card;
    update({ worlds });
  };
  const removeCard = (i: number) => update({ worlds: v.worlds.filter((_, idx) => idx !== i) });
  const addCard = () =>
    update({
      worlds: [
        ...v.worlds,
        {
          id: crypto.randomUUID(),
          key: "forge",
          bigIcon: "NEW",
          label: { ro: "", en: "" },
          title: { ro: "", en: "" },
          body: { ro: "", en: "" },
          tags: [],
        },
      ],
    });

  return (
    <div className="space-y-5">
      <Card title="Antet secțiune">
        <BilingualInput
          label="Titlu (rând 1)"
          value={v.heading.lead}
          onChange={(lead) => update({ heading: { ...v.heading, lead } })}
        />
        <BilingualInput
          label="Titlu (rând 2 accent)"
          value={v.heading.accent}
          onChange={(accent) => update({ heading: { ...v.heading, accent } })}
        />
        <BilingualInput label="Intro" value={v.intro} onChange={(intro) => update({ intro })} multiline rows={2} />
      </Card>

      <Card
        title={`Lumi (${v.worlds.length})`}
        action={<Button size="sm" variant="secondary" onClick={addCard}><Plus size={12} className="inline mr-1" />Adaugă lume</Button>}
      >
        <div className="space-y-4">
          {v.worlds.map((w, i) => (
            <CardRow
              key={w.id}
              idx={i}
              card={w}
              onChange={(c) => updateCard(i, c)}
              onDelete={() => removeCard(i)}
            />
          ))}
        </div>
      </Card>
    </div>
  );
}

function CardRow({ idx, card, onChange, onDelete }: { idx: number; card: WorldCard; onChange: (c: WorldCard) => void; onDelete: () => void }) {
  const set = (patch: Partial<WorldCard>) => onChange({ ...card, ...patch });
  const setTag = (i: number, t: Bilingual) => {
    const tags = card.tags.slice();
    tags[i] = t;
    set({ tags });
  };
  const addTag = () => set({ tags: [...card.tags, { ro: "", en: "" }] });
  const removeTag = (i: number) => set({ tags: card.tags.filter((_, x) => x !== i) });
  return (
    <div className="bg-white/5 border border-white/10 rounded-md p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs opacity-50 font-bold uppercase tracking-widest">Lume #{idx + 1}</span>
        <button onClick={onDelete} className="text-white/40 hover:text-red-400" title="Șterge">
          <Trash2 size={14} />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Stil vizual</Label>
          <Select
            value={card.key}
            onChange={(key) => set({ key })}
            options={[
              { value: "forge", label: "Forge (albastru)" },
              { value: "temple", label: "Temple (mov)" },
              { value: "path", label: "Path (cyan)" },
              { value: "sanctuary", label: "Sanctuary (portocaliu)" },
            ]}
          />
        </div>
        <div>
          <Label>Text fundal (big icon)</Label>
          <Input value={card.bigIcon} onChange={(v) => set({ bigIcon: v })} placeholder="FORGE" />
        </div>
      </div>
      <BilingualInput label="Etichetă mică" value={card.label} onChange={(label) => set({ label })} />
      <BilingualInput label="Titlu (H3)" value={card.title} onChange={(title) => set({ title })} />
      <BilingualInput label="Descriere" value={card.body} onChange={(body) => set({ body })} multiline rows={4} />
      <div>
        <Label>Tag-uri</Label>
        <div className="space-y-2">
          {card.tags.map((t, i) => (
            <div key={i} className="flex gap-2 items-start">
              <div className="flex-1">
                <BilingualInput label={`Tag #${i + 1}`} value={t} onChange={(v) => setTag(i, v)} />
              </div>
              <button onClick={() => removeTag(i)} className="mt-6 text-white/40 hover:text-red-400">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          <Button size="sm" variant="secondary" onClick={addTag}>
            <Plus size={12} className="inline mr-1" />Adaugă tag
          </Button>
        </div>
      </div>
    </div>
  );
}
