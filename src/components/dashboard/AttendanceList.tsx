"use client";

import { useState } from "react";

export type AttendanceRow = {
  slotId: string;
  slotDate: string;
  validatedAt: string;
  method: string;
};

export default function AttendanceList({ rows }: { rows: AttendanceRow[] }) {
  const [expanded, setExpanded] = useState(false);

  if (rows.length === 0) {
    return (
      <div className="m-mini-meta">
        Încă nu ai fost marcat la nicio sesiune. Arată cardul tău QR coach-ului
        la intrarea în sesiune.
      </div>
    );
  }

  const shown = expanded ? rows : rows.slice(0, 3);
  const hasMore = rows.length > 3;

  return (
    <>
      <ul className="m-upcoming-list">
        {shown.map((r) => (
          <li key={`${r.slotId}-${r.slotDate}`} className="m-upcoming-row">
            <div className="m-upcoming-main">
              <div className="m-upcoming-title">{r.slotDate}</div>
              <div className="m-upcoming-meta">
                {new Date(r.validatedAt).toLocaleString("ro-RO")}
              </div>
            </div>
            <span className="m-upcoming-world">{r.method}</span>
          </li>
        ))}
      </ul>
      {hasMore && (
        <button
          type="button"
          className="m-mini-link"
          onClick={() => setExpanded((v) => !v)}
          style={{
            background: "none",
            border: "none",
            padding: 0,
            cursor: "pointer",
            marginTop: "0.5rem",
          }}
        >
          {expanded
            ? "Ascunde"
            : `Vezi toate (${rows.length}) →`}
        </button>
      )}
    </>
  );
}
