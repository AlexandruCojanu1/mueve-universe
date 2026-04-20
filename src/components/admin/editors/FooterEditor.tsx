"use client";
import { useState } from "react";
import type { FooterData, FooterSocial } from "@/lib/content-types";
import { BilingualInput, Input, Label, Card, Button, Select } from "../fields";
import { Trash2, Plus } from "lucide-react";

export default function FooterEditor({ value, onChange }: { value: FooterData; onChange: (v: FooterData) => void }) {
  const [v, setV] = useState<FooterData>(value);
  const update = (patch: Partial<FooterData>) => {
    const next = { ...v, ...patch };
    setV(next);
    onChange(next);
  };
  const setSocial = (i: number, s: FooterSocial) => {
    const socials = v.socials.slice();
    socials[i] = s;
    update({ socials });
  };
  const remove = (i: number) => update({ socials: v.socials.filter((_, x) => x !== i) });
  const add = () =>
    update({
      socials: [...v.socials, { id: crypto.randomUUID(), label: "Instagram", href: "#", icon: "instagram" }],
    });

  return (
    <div className="space-y-5">
      <Card title="Footer">
        <BilingualInput label="Copyright" value={v.copyright} onChange={(copyright) => update({ copyright })} />
      </Card>
      <Card
        title={`Social links (${v.socials.length})`}
        action={<Button size="sm" variant="secondary" onClick={add}><Plus size={12} className="inline mr-1" />Adaugă</Button>}
      >
        <div className="space-y-3">
          {v.socials.map((s, i) => (
            <div key={s.id} className="bg-white/5 border border-white/10 rounded-md p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs opacity-50">#{i + 1}</span>
                <button onClick={() => remove(i)} className="text-white/40 hover:text-red-400">
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Icon</Label>
                  <Select
                    value={s.icon}
                    onChange={(icon) => setSocial(i, { ...s, icon })}
                    options={[
                      { value: "instagram", label: "Instagram" },
                      { value: "tiktok", label: "TikTok" },
                      { value: "facebook", label: "Facebook" },
                      { value: "youtube", label: "YouTube" },
                      { value: "twitter", label: "Twitter/X" },
                    ]}
                  />
                </div>
                <div>
                  <Label>Label (accesibilitate)</Label>
                  <Input value={s.label} onChange={(label) => setSocial(i, { ...s, label })} />
                </div>
                <div>
                  <Label>URL</Label>
                  <Input value={s.href} onChange={(href) => setSocial(i, { ...s, href })} placeholder="https://..." />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
