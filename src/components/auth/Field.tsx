"use client";
import { useState, type ReactNode } from "react";

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
  const isPassword = type === "password";
  const [show, setShow] = useState(false);

  return (
    <label className="auth-field">
      <div className="auth-field-row">
        <span className="auth-field-label">{label}</span>
        {rightLink && <div className="auth-field-link">{rightLink}</div>}
      </div>
      <div className={isPassword ? "auth-field-wrap" : undefined}>
        <input
          type={isPassword && show ? "text" : type}
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          placeholder={placeholder ?? (type === "password" ? "••••••••" : undefined)}
          className="auth-field-input"
        />
        {isPassword && (
          <button
            type="button"
            className="auth-eye"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "Ascunde parola" : "Arată parola"}
            tabIndex={-1}
          >
            {show ? (
              /* eye-off */
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              /* eye */
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        )}
      </div>
      {hint && <div className="auth-field-hint">{hint}</div>}
    </label>
  );
}
