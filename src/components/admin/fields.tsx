"use client";
import type { Bilingual } from "@/lib/content-types";

export function Label({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-widest opacity-60 font-bold mb-1.5">{children}</div>
      {hint && <div className="text-xs opacity-40 mb-2">{hint}</div>}
    </div>
  );
}

export function Input({
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2 rounded-md bg-black/50 border border-white/15 focus:border-[var(--sun)] outline-none text-sm"
    />
  );
}

export function TextArea({
  value,
  onChange,
  rows = 4,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <textarea
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      placeholder={placeholder}
      className="w-full px-3 py-2 rounded-md bg-black/50 border border-white/15 focus:border-[var(--sun)] outline-none text-sm resize-y"
    />
  );
}

export function BilingualInput({
  label,
  value,
  onChange,
  multiline = false,
  rows = 3,
}: {
  label: string;
  value: Bilingual | undefined;
  onChange: (v: Bilingual) => void;
  multiline?: boolean;
  rows?: number;
}) {
  const safe: Bilingual = value ?? { ro: "", en: "" };
  const Comp = multiline ? TextArea : Input;
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-widest opacity-40 mb-1">Română</div>
          <Comp
            value={safe.ro}
            onChange={(v: string) => onChange({ ...safe, ro: v })}
            rows={rows}
          />
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-widest opacity-40 mb-1">English</div>
          <Comp
            value={safe.en}
            onChange={(v: string) => onChange({ ...safe, en: v })}
            rows={rows}
          />
        </div>
      </div>
    </div>
  );
}

export function Select<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      className="w-full px-3 py-2 rounded-md bg-black/50 border border-white/15 focus:border-[var(--sun)] outline-none text-sm"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value} className="bg-[#0b0f24]">
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function Card({ children, title, action }: { children: React.ReactNode; title?: string; action?: React.ReactNode }) {
  return (
    <div className="bg-black/30 border border-white/10 rounded-lg p-5 space-y-4">
      {(title || action) && (
        <div className="flex items-center justify-between">
          {title && <div className="text-sm font-bold uppercase tracking-widest">{title}</div>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

export function Button({
  children,
  onClick,
  type = "button",
  variant = "primary",
  disabled,
  size = "md",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: "primary" | "secondary" | "danger" | "ghost";
  disabled?: boolean;
  size?: "sm" | "md";
}) {
  const variants = {
    primary: "bg-[var(--sun)] text-[var(--deep)] hover:brightness-110",
    secondary: "border border-white/20 hover:bg-white/5",
    danger: "border border-red-500/40 text-red-300 hover:bg-red-500/10",
    ghost: "opacity-60 hover:opacity-100",
  };
  const sizes = { sm: "text-[11px] px-2.5 py-1.5", md: "text-xs px-4 py-2" };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={
        "font-bold uppercase tracking-widest rounded-md transition disabled:opacity-50 " +
        variants[variant] +
        " " +
        sizes[size]
      }
    >
      {children}
    </button>
  );
}
