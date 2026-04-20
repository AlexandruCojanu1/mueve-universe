"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Eye, EyeOff, Copy, Trash2, Plus } from "lucide-react";
import type { Section } from "@/db/schema";
import { SECTION_TYPE_LABELS, ADDABLE_SECTION_TYPES, type SectionType } from "@/lib/content-types";
import {
  reorderSections,
  toggleVisibility,
  duplicateSection,
  deleteSection,
  addSection,
} from "@/app/admin/actions";

export default function SectionsList({ initial }: { initial: Section[] }) {
  const [items, setItems] = useState(initial);
  const [pendingId, setPending] = useState<string | null>(null);
  const [menuAfter, setMenuAfter] = useState<number | null>(null);
  const [, start] = useTransition();
  const router = useRouter();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = items.findIndex((i) => i.id === active.id);
    const newIdx = items.findIndex((i) => i.id === over.id);
    const next = arrayMove(items, oldIdx, newIdx);
    setItems(next);
    start(async () => {
      await reorderSections(next.map((i) => i.id));
      router.refresh();
    });
  }

  function onToggle(id: string) {
    setPending(id);
    setItems((prev) => prev.map((p) => (p.id === id ? { ...p, visible: !p.visible } : p)));
    start(async () => {
      await toggleVisibility(id);
      setPending(null);
      router.refresh();
    });
  }

  function onDuplicate(id: string) {
    setPending(id);
    start(async () => {
      await duplicateSection(id);
      setPending(null);
      router.refresh();
    });
  }

  function onDelete(id: string) {
    if (!confirm("Sigur ștergi această secțiune?")) return;
    setPending(id);
    setItems((prev) => prev.filter((p) => p.id !== id));
    start(async () => {
      await deleteSection(id);
      setPending(null);
      router.refresh();
    });
  }

  function onAdd(type: SectionType, afterOrder: number | null) {
    setMenuAfter(null);
    start(async () => {
      await addSection(type, afterOrder ?? undefined);
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          {items.map((it, idx) => (
            <div key={it.id}>
              <Row
                s={it}
                pending={pendingId === it.id}
                onToggle={() => onToggle(it.id)}
                onDuplicate={() => onDuplicate(it.id)}
                onDelete={() => onDelete(it.id)}
              />
              <AddBar
                afterOrder={it.order}
                open={menuAfter === idx}
                onOpen={() => setMenuAfter((v) => (v === idx ? null : idx))}
                onPick={(t) => onAdd(t, it.order)}
              />
            </div>
          ))}
        </SortableContext>
      </DndContext>
      {items.length === 0 && (
        <AddBar
          afterOrder={null}
          open={menuAfter === -1}
          onOpen={() => setMenuAfter((v) => (v === -1 ? null : -1))}
          onPick={(t) => onAdd(t, null)}
          alwaysVisible
        />
      )}
    </div>
  );
}

function Row({
  s,
  pending,
  onToggle,
  onDuplicate,
  onDelete,
}: {
  s: Section;
  pending: boolean;
  onToggle: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: s.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : pending ? 0.6 : 1,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group flex items-stretch bg-black/30 border border-white/10 rounded-lg overflow-hidden hover:border-white/25 transition"
    >
      <button
        className="px-2 flex items-center text-white/30 hover:text-white/80 cursor-grab active:cursor-grabbing"
        aria-label="Drag"
        {...attributes}
        {...listeners}
      >
        <GripVertical size={18} />
      </button>
      <Link href={`/admin/sections/${s.id}`} className="flex-1 px-3 py-4 flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-widest font-bold text-[var(--sun)]">
              {SECTION_TYPE_LABELS[s.type as SectionType] || s.type}
            </span>
            {!s.visible && <span className="text-[10px] uppercase tracking-widest opacity-50 border border-white/20 rounded px-1.5 py-0.5">ascuns</span>}
          </div>
          <SectionPreview type={s.type} data={s.data as Record<string, unknown>} />
        </div>
      </Link>
      <div className="flex items-center gap-1 px-2 opacity-0 group-hover:opacity-100 transition">
        <IconBtn title={s.visible ? "Ascunde" : "Arată"} onClick={onToggle}>
          {s.visible ? <Eye size={16} /> : <EyeOff size={16} />}
        </IconBtn>
        <IconBtn title="Duplică" onClick={onDuplicate}>
          <Copy size={16} />
        </IconBtn>
        <IconBtn title="Șterge" onClick={onDelete}>
          <Trash2 size={16} />
        </IconBtn>
      </div>
    </div>
  );
}

function IconBtn({ children, onClick, title }: { children: React.ReactNode; onClick: () => void; title: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="p-2 rounded hover:bg-white/10 text-white/60 hover:text-white/100"
    >
      {children}
    </button>
  );
}

function AddBar({
  afterOrder,
  open,
  onOpen,
  onPick,
  alwaysVisible = false,
}: {
  afterOrder: number | null;
  open: boolean;
  onOpen: () => void;
  onPick: (type: SectionType) => void;
  alwaysVisible?: boolean;
}) {
  return (
    <div
      className={
        "relative flex items-center justify-center py-1 " +
        (alwaysVisible
          ? "opacity-100"
          : open
          ? "opacity-100"
          : "opacity-0 hover:opacity-100 focus-within:opacity-100 transition")
      }
    >
      <div className="flex-1 h-px bg-white/10" />
      <button
        onClick={onOpen}
        className="mx-2 w-7 h-7 rounded-full border border-white/20 hover:border-[var(--sun)] flex items-center justify-center text-white/50 hover:text-[var(--sun)] hover:bg-[var(--sun)]/5 transition"
        title="Adaugă secțiune"
        aria-label="Adaugă secțiune"
      >
        <Plus size={14} />
      </button>
      <div className="flex-1 h-px bg-white/10" />
      {open && (
        <div className="absolute top-full mt-2 z-20 bg-[#0f1330] border border-white/10 rounded-lg p-2 shadow-2xl w-64 max-h-80 overflow-auto">
          <div className="text-[10px] uppercase tracking-widest opacity-50 px-2 py-1.5">
            Tip secțiune
          </div>
          {ADDABLE_SECTION_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                onPick(t);
                void afterOrder;
              }}
              className="w-full text-left px-3 py-2 rounded hover:bg-white/5 text-sm"
            >
              {SECTION_TYPE_LABELS[t]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SectionPreview({ type, data }: { type: string; data: Record<string, unknown> }) {
  const text = summarize(type, data);
  return <div className="text-sm opacity-70 truncate mt-1">{text}</div>;
}

function summarize(type: string, d: Record<string, unknown>): string {
  const pick = (obj: unknown): string => {
    if (!obj || typeof obj !== "object") return "";
    const ro = (obj as { ro?: unknown }).ro;
    const en = (obj as { en?: unknown }).en;
    return (typeof ro === "string" && ro) || (typeof en === "string" && en) || "";
  };
  switch (type) {
    case "nav":
      return "Logo: " + (d.logo || "—");
    case "hero":
      return [pick(d.headingTop), pick(d.headingAccent), pick(d.headingBottom)].filter(Boolean).join(" · ");
    case "worlds": {
      const list = Array.isArray(d.worlds) ? d.worlds : [];
      return `${list.length} lumi`;
    }
    case "program": {
      const slots = Array.isArray(d.slots) ? d.slots : [];
      return `${slots.length} slot-uri`;
    }
    case "mission": {
      const v = Array.isArray(d.values) ? d.values : [];
      return `${v.length} valori — ${pick(d.intro).slice(0, 80)}`;
    }
    case "join":
      return pick(d.body).slice(0, 100);
    case "footer": {
      const s = Array.isArray(d.socials) ? d.socials : [];
      return `${s.length} social links`;
    }
    case "text":
      return pick(d.heading) || pick(d.body).slice(0, 100);
    case "cta":
      return pick(d.label) + " → " + (d.href || "#");
    case "image":
      return String(d.src || "fără imagine");
    default:
      return "";
  }
}
