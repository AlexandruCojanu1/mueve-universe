"use client";
import { signIn } from "next-auth/react";
import type { ReactNode } from "react";

export default function ProviderButtons({
  callbackUrl,
  hasGoogle,
  hasApple,
  hasMagic,
  onMagicClick,
}: {
  callbackUrl: string;
  hasGoogle: boolean;
  hasApple: boolean;
  hasMagic: boolean;
  onMagicClick?: () => void;
}) {
  return (
    <div className="auth-providers">
      <ProviderButton
        enabled={hasGoogle}
        onClick={() => signIn("google", { callbackUrl })}
        icon={<GoogleIcon />}
        label="Continuă cu Google"
      />
      <ProviderButton
        enabled={hasApple}
        onClick={() => signIn("apple", { callbackUrl })}
        icon={<AppleIcon />}
        label="Continuă cu Apple"
      />
      {hasMagic && onMagicClick && (
        <ProviderButton
          enabled
          onClick={onMagicClick}
          icon={<MailIcon />}
          label="Trimite-mi un link magic"
        />
      )}
    </div>
  );
}

function ProviderButton({
  enabled,
  onClick,
  icon,
  label,
}: {
  enabled: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={enabled ? onClick : undefined}
      disabled={!enabled}
      className={"auth-provider-btn" + (enabled ? "" : " is-disabled")}
    >
      <span className="auth-provider-icon">{icon}</span>
      <span className="auth-provider-label">{label}</span>
      {!enabled && <span className="auth-provider-soon">Curând</span>}
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.24 1.44-1.68 4.2-5.5 4.2-3.3 0-6-2.73-6-6.1s2.7-6.1 6-6.1c1.88 0 3.14.8 3.86 1.48l2.63-2.53C16.88 3.57 14.69 2.5 12 2.5 6.76 2.5 2.5 6.76 2.5 12S6.76 21.5 12 21.5c6.92 0 9.5-4.86 9.5-7.4 0-.5-.05-.88-.12-1.26L12 12.1z"
      />
      <path
        fill="#34A853"
        d="M3.88 7.47l3.2 2.35C7.97 7.73 9.83 6.4 12 6.4c1.88 0 3.14.8 3.86 1.48l2.63-2.53C16.88 3.57 14.69 2.5 12 2.5 8.2 2.5 4.94 4.5 3.88 7.47z"
      />
      <path
        fill="#FBBC05"
        d="M12 21.5c2.62 0 4.8-.86 6.4-2.35l-3.1-2.55c-.87.6-2.03.99-3.3.99-2.55 0-4.72-1.68-5.5-4.01l-3.16 2.43C4.82 19.5 8.16 21.5 12 21.5z"
      />
      <path
        fill="#4285F4"
        d="M21.38 12.24c0-.5-.05-.88-.12-1.26H12v3.9h5.5c-.26 1.56-1.69 3.2-3.27 3.82l3.15 2.45c1.86-1.72 3.2-4.34 3.2-8.91z"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
      <path
        fill="currentColor"
        d="M16.37 12.52c-.02-2.36 1.93-3.49 2.02-3.55-1.1-1.61-2.82-1.84-3.43-1.86-1.46-.15-2.85.86-3.59.86-.75 0-1.89-.84-3.11-.82-1.6.02-3.08.93-3.9 2.37-1.66 2.88-.43 7.15 1.2 9.49.8 1.15 1.75 2.44 3 2.39 1.2-.05 1.66-.78 3.11-.78 1.45 0 1.86.78 3.13.75 1.3-.02 2.11-1.17 2.9-2.32.91-1.33 1.29-2.62 1.31-2.69-.03-.01-2.51-.96-2.54-3.84zM13.84 5.45c.66-.81 1.11-1.93.99-3.05-.96.04-2.11.64-2.8 1.44-.61.71-1.15 1.85-1.01 2.95 1.07.08 2.17-.54 2.82-1.34z"
      />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 6h16v12H4z M4 7l8 6 8-6"
      />
    </svg>
  );
}
