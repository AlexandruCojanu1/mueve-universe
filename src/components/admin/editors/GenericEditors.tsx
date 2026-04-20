"use client";
import { useState } from "react";
import type { TextData, CtaData, ImageData } from "@/lib/content-types";
import { BilingualInput, Input, Label, Card, Select } from "../fields";

export function TextEditor({ value, onChange }: { value: TextData; onChange: (v: TextData) => void }) {
  const [v, setV] = useState<TextData>(value);
  const update = (patch: Partial<TextData>) => {
    const next = { ...v, ...patch };
    setV(next);
    onChange(next);
  };
  return (
    <div className="space-y-5">
      <Card title="Text">
        <BilingualInput label="Titlu (opțional)" value={v.heading ?? { ro: "", en: "" }} onChange={(heading) => update({ heading })} />
        <BilingualInput label="Conținut" value={v.body} onChange={(body) => update({ body })} multiline rows={6} />
        <div>
          <Label>Aliniere</Label>
          <Select
            value={v.align}
            onChange={(align) => update({ align })}
            options={[
              { value: "left", label: "Stânga" },
              { value: "center", label: "Centru" },
              { value: "right", label: "Dreapta" },
            ]}
          />
        </div>
      </Card>
    </div>
  );
}

export function CtaEditor({ value, onChange }: { value: CtaData; onChange: (v: CtaData) => void }) {
  const [v, setV] = useState<CtaData>(value);
  const update = (patch: Partial<CtaData>) => {
    const next = { ...v, ...patch };
    setV(next);
    onChange(next);
  };
  return (
    <div className="space-y-5">
      <Card title="Buton">
        <BilingualInput label="Text" value={v.label} onChange={(label) => update({ label })} />
        <div>
          <Label>URL</Label>
          <Input value={v.href} onChange={(href) => update({ href })} placeholder="https://..." />
        </div>
        <div>
          <Label>Stil</Label>
          <Select
            value={v.variant}
            onChange={(variant) => update({ variant })}
            options={[
              { value: "primary", label: "Primar (galben)" },
              { value: "secondary", label: "Secundar (outline)" },
            ]}
          />
        </div>
      </Card>
    </div>
  );
}

export function ImageEditor({ value, onChange }: { value: ImageData; onChange: (v: ImageData) => void }) {
  const [v, setV] = useState<ImageData>(value);
  const update = (patch: Partial<ImageData>) => {
    const next = { ...v, ...patch };
    setV(next);
    onChange(next);
  };
  return (
    <div className="space-y-5">
      <Card title="Imagine">
        <div>
          <Label hint="Introdu URL-ul imaginii (https://... sau /path pentru local)">URL imagine</Label>
          <Input value={v.src} onChange={(src) => update({ src })} placeholder="https://..." />
        </div>
        <div>
          <Label>Text alternativ</Label>
          <Input value={v.alt} onChange={(alt) => update({ alt })} />
        </div>
        <BilingualInput
          label="Descriere (caption)"
          value={v.caption ?? { ro: "", en: "" }}
          onChange={(caption) => update({ caption })}
        />
      </Card>
    </div>
  );
}
