import type { ReactNode } from "react";

export default function Alert({
  kind = "error",
  children,
}: {
  kind?: "error" | "success" | "info";
  children: ReactNode;
}) {
  const palette =
    kind === "success"
      ? {
          color: "var(--sun)",
          background: "rgba(245,221,90,0.08)",
          border: "1px solid rgba(245,221,90,0.35)",
        }
      : kind === "info"
        ? {
            color: "#cbd5ff",
            background: "rgba(120,120,200,0.1)",
            border: "1px solid rgba(160,160,220,0.3)",
          }
        : {
            color: "#FCA5A5",
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.35)",
          };
  return (
    <div
      className="text-xs rounded-lg px-3 py-2.5 leading-relaxed"
      style={palette}
    >
      {children}
    </div>
  );
}
