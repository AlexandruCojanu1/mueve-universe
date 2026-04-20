"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import type { Section } from "@/db/schema";
import { SECTION_TYPE_LABELS, type SectionType } from "@/lib/content-types";
import { updateSectionData } from "@/app/admin/actions";
import { Button } from "./fields";
import NavEditor from "./editors/NavEditor";
import HeroEditor from "./editors/HeroEditor";
import WorldsEditor from "./editors/WorldsEditor";
import ProgramEditor from "./editors/ProgramEditor";
import MissionEditor from "./editors/MissionEditor";
import JoinEditor from "./editors/JoinEditor";
import FooterEditor from "./editors/FooterEditor";
import { TextEditor, CtaEditor, ImageEditor } from "./editors/GenericEditors";

type AnyData = Record<string, unknown>;

export default function SectionEditor({ section }: { section: Section }) {
  const router = useRouter();
  const [data, setData] = useState<AnyData>(section.data as AnyData);
  const [dirty, setDirty] = useState(false);
  const [saving, start] = useTransition();
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const onChange = (next: AnyData) => {
    setData(next);
    setDirty(true);
  };

  const onSave = () => {
    start(async () => {
      await updateSectionData(section.id, data);
      setDirty(false);
      setSavedAt(new Date());
      router.refresh();
    });
  };

  const Editor = EDITORS[section.type as SectionType];
  const label = SECTION_TYPE_LABELS[section.type as SectionType] || section.type;

  return (
    <div>
      <header className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Link href="/admin" className="text-xs uppercase tracking-widest opacity-60 hover:opacity-100 inline-flex items-center gap-1 mb-2">
            <ArrowLeft size={12} /> Înapoi la secțiuni
          </Link>
          <h1 className="text-2xl font-black uppercase tracking-tight">Editare: {label}</h1>
        </div>
        <div className="flex items-center gap-3">
          {savedAt && !dirty && <span className="text-xs opacity-60">Salvat la {savedAt.toLocaleTimeString()}</span>}
          {dirty && <span className="text-xs text-[var(--sun)]">Modificări nesalvate</span>}
          <Button onClick={onSave} disabled={!dirty || saving}>
            {saving ? "Salvez..." : "Salvează"}
          </Button>
        </div>
      </header>

      {Editor ? (
        <Editor value={data as never} onChange={onChange as never} />
      ) : (
        <div className="opacity-60">Nu există editor pentru tipul <code>{section.type}</code>.</div>
      )}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const EDITORS: Record<SectionType, React.ComponentType<{ value: any; onChange: (v: any) => void }> | undefined> = {
  nav: NavEditor,
  hero: HeroEditor,
  worlds: WorldsEditor,
  program: ProgramEditor,
  mission: MissionEditor,
  join: JoinEditor,
  footer: FooterEditor,
  text: TextEditor,
  cta: CtaEditor,
  image: ImageEditor,
};
