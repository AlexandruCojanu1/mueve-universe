"use client";
import { useEffect, useRef, useState } from "react";
import { signOut } from "next-auth/react";

export default function AvatarMenu({ initials }: { initials: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        className="m-avatar"
        onClick={() => setOpen((v) => !v)}
        aria-label="Meniu cont"
      >
        {initials}
      </button>
      {open && (
        <div className="m-avatar-menu">
          <button
            type="button"
            className="m-avatar-menu-item"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            Ieși din cont
          </button>
        </div>
      )}
    </div>
  );
}
