"use client";
import { useEffect, useRef, useState } from "react";

type Attendee = {
  userId: string;
  name: string | null;
  email: string;
  method: "qr" | "manual";
  at: string;
};

export default function Scanner({ slotId, slotDate }: { slotId: string; slotDate: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scannerRef = useRef<unknown>(null);
  const [running, setRunning] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [last, setLast] = useState<{ ok: boolean; msg: string } | null>(null);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [manualEmail, setManualEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const cooldown = useRef(0);

  async function handleToken(tokenOrEmail: string, method: "qr" | "manual" = "qr", force = false) {
    const now = Date.now();
    if (method === "qr" && !force && now - cooldown.current < 2000) return;
    cooldown.current = now;
    setBusy(true);
    try {
      const res = await fetch("/api/coach/attend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: method === "qr" ? tokenOrEmail : undefined,
          email: method === "manual" ? tokenOrEmail : undefined,
          slotId,
          slotDate,
          method,
          force,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        attendee?: Attendee & { userId: string; name: string | null; email: string };
        already?: boolean;
        noAccess?: boolean;
      };

      if (data.ok && data.attendee) {
        setLast({
          ok: true,
          msg: `${data.attendee.name || data.attendee.email} ${
            data.already ? "— deja marcat" : "marcat prezent"
          }`,
        });
        setAttendees((prev) => [
          data.attendee as Attendee,
          ...prev.filter((a) => a.userId !== data.attendee!.userId),
        ]);
        return;
      }

      if (data.noAccess && data.attendee && !force) {
        const who = data.attendee.name || data.attendee.email;
        if (confirm(`${who}: fără abonament activ. Lași totuși?`)) {
          await handleToken(tokenOrEmail, method, true);
          return;
        }
        setLast({ ok: false, msg: `${who} — refuzat (fără plan)` });
        return;
      }

      setLast({ ok: false, msg: data.error ?? "Validare eșuată." });
    } catch {
      setLast({ ok: false, msg: "Eroare de rețea." });
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    async function start() {
      try {
        const mod = await import("html5-qrcode");
        const { Html5Qrcode } = mod;
        const el = containerRef.current;
        if (!el || cancelled) return;
        el.innerHTML = "";
        const id = "qr-reader-" + Math.random().toString(36).slice(2, 8);
        const host = document.createElement("div");
        host.id = id;
        el.appendChild(host);
        const scanner = new Html5Qrcode(id, { verbose: false });
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 260, height: 260 } },
          (decoded) => {
            handleToken(decoded, "qr");
          },
          () => {},
        );
        if (cancelled) {
          try {
            await scanner.stop();
          } catch {}
          return;
        }
        setRunning(true);
      } catch (e) {
        setErr(
          e instanceof Error ? e.message : "Nu pot deschide camera. Verifică permisiunile browserului.",
        );
      }
    }
    start();
    return () => {
      cancelled = true;
      const s = scannerRef.current as { stop?: () => Promise<void> } | null;
      if (s?.stop) s.stop().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="text-xs uppercase tracking-widest opacity-60 mb-2">Scanează QR</div>
          <div className="relative bg-black rounded-lg overflow-hidden border border-white/10 aspect-square">
            <div ref={containerRef} className="absolute inset-0" />
            {!running && !err && (
              <div className="absolute inset-0 flex items-center justify-center text-sm opacity-60">
                Pornesc camera...
              </div>
            )}
            {err && (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-red-400 p-6 text-center">
                {err}
              </div>
            )}
          </div>
          {last && (
            <div
              className={
                "mt-3 p-3 rounded-md text-sm " +
                (last.ok ? "bg-green-500/15 text-green-300" : "bg-red-500/15 text-red-300")
              }
            >
              {last.msg}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <div className="text-xs uppercase tracking-widest opacity-60 mb-2">Manual (email)</div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!manualEmail.trim()) return;
                handleToken(manualEmail.trim(), "manual");
                setManualEmail("");
              }}
              className="flex gap-2"
            >
              <input
                type="email"
                value={manualEmail}
                onChange={(e) => setManualEmail(e.target.value)}
                placeholder="user@exemplu.com"
                className="flex-1 px-3 py-2 rounded-md bg-black/50 border border-white/15 focus:border-[var(--sun)] outline-none text-sm"
              />
              <button
                type="submit"
                disabled={busy}
                className="px-4 py-2 rounded-md bg-[var(--sun)] text-[var(--deep)] font-black uppercase text-xs tracking-widest disabled:opacity-50"
              >
                Marchează
              </button>
            </form>
          </div>

          <div>
            <div className="text-xs uppercase tracking-widest opacity-60 mb-2">
              Prezenți ({attendees.length})
            </div>
            {attendees.length === 0 ? (
              <div className="opacity-50 text-sm">Niciun prezent înregistrat încă.</div>
            ) : (
              <ul className="space-y-1 text-sm">
                {attendees.map((a) => (
                  <li
                    key={a.userId}
                    className="flex items-center justify-between bg-white/5 border border-white/10 rounded-md px-3 py-2"
                  >
                    <span>
                      <span className="font-bold">{a.name || a.email}</span>
                      {a.name && <span className="opacity-50 text-xs ml-2">{a.email}</span>}
                    </span>
                    <span className="text-[10px] uppercase tracking-widest opacity-50">
                      {a.method}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
