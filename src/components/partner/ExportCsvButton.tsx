"use client";

type Visit = {
  createdAt: string;
  memberName: string | null;
  memberEmail: string;
  valid: boolean;
  reason: string | null;
};

function csvEscape(s: string): string {
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export default function ExportCsvButton({ visits }: { visits: Visit[] }) {
  function handle() {
    const header = ["Data", "Nume", "Email", "Status", "Motiv"];
    const lines = [header.join(",")];
    for (const v of visits) {
      lines.push(
        [
          new Date(v.createdAt).toISOString(),
          v.memberName ?? "",
          v.memberEmail,
          v.valid ? "valid" : "refuzat",
          v.reason ?? "",
        ]
          .map((x) => csvEscape(String(x)))
          .join(","),
      );
    }
    const blob = new Blob([lines.join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mueve-partner-visits-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      className="dash-btn dash-btn-light"
      onClick={handle}
      disabled={visits.length === 0}
    >
      Export CSV
    </button>
  );
}
