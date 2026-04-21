"use client";
import type { ReactNode } from "react";

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
  return (
    <label className="auth-field">
      <div className="auth-field-row">
        <span className="auth-field-label">{label}</span>
        {rightLink && <div className="auth-field-link">{rightLink}</div>}
      </div>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        placeholder={placeholder ?? (type === "password" ? "••••••••" : undefined)}
        className="auth-field-input"
      />
      {hint && <div className="auth-field-hint">{hint}</div>}
    </label>
  );
}
