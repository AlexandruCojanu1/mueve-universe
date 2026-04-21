"use client";
import type { CSSProperties, ReactNode } from "react";

export default function Field({
  label,
  type,
  value,
  onChange,
  autoComplete,
  required,
  placeholder,
  rightLink,
  hint,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  required?: boolean;
  placeholder?: string;
  rightLink?: ReactNode;
  hint?: string;
}) {
  const inputStyle: CSSProperties = {
    height: "52px",
    padding: "0 1rem",
    background: "rgba(0,0,0,0.42)",
    border: "1px solid rgba(255,255,255,0.18)",
    color: "var(--w)",
  };
  return (
    <label className="block space-y-2">
      <div className="flex items-baseline justify-between gap-4">
        <span className="block text-[0.62rem] uppercase tracking-[0.3em] font-bold opacity-60">
          {label}
        </span>
        {rightLink}
      </div>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className="w-full rounded-xl outline-none text-sm transition"
        style={inputStyle}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "var(--sun)";
          e.currentTarget.style.background = "rgba(0,0,0,0.6)";
          e.currentTarget.style.boxShadow = "0 0 0 3px rgba(245,221,90,0.14)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)";
          e.currentTarget.style.background = "rgba(0,0,0,0.42)";
          e.currentTarget.style.boxShadow = "none";
        }}
      />
      {hint && <div className="text-[0.7rem] opacity-55 leading-snug">{hint}</div>}
    </label>
  );
}
