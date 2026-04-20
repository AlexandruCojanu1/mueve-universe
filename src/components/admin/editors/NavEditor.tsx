"use client";
import { useState } from "react";
import type { NavData, NavLink } from "@/lib/content-types";
import { BilingualInput, Input, Label, Card, Button } from "../fields";
import { Trash2, Plus } from "lucide-react";

export default function NavEditor({ value, onChange }: { value: NavData; onChange: (v: NavData) => void }) {
  const [v, setV] = useState<NavData>(value);
  const update = (patch: Partial<NavData>) => {
    const next = { ...v, ...patch };
    setV(next);
    onChange(next);
  };
  const updateLink = (i: number, link: NavLink) => {
    const links = v.links.slice();
    links[i] = link;
    update({ links });
  };
  const removeLink = (i: number) => update({ links: v.links.filter((_, idx) => idx !== i) });
  const addLink = () => update({ links: [...v.links, { label: { ro: "Link", en: "Link" }, href: "#" }] });

  return (
    <div className="space-y-5">
      <Card title="General">
        <div>
          <Label>Logo (text)</Label>
          <Input value={v.logo} onChange={(val) => update({ logo: val })} />
        </div>
      </Card>
      <Card
        title={`Linkuri (${v.links.length})`}
        action={<Button size="sm" variant="secondary" onClick={addLink}><Plus size={12} className="inline mr-1" />Adaugă</Button>}
      >
        <div className="space-y-3">
          {v.links.map((l, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-md p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs opacity-50">#{i + 1}</span>
                <button onClick={() => removeLink(i)} className="text-white/40 hover:text-red-400" title="Șterge">
                  <Trash2 size={14} />
                </button>
              </div>
              <BilingualInput label="Text link" value={l.label} onChange={(label) => updateLink(i, { ...l, label })} />
              <div>
                <Label>Href (ancoră sau URL)</Label>
                <Input value={l.href} onChange={(href) => updateLink(i, { ...l, href })} />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
