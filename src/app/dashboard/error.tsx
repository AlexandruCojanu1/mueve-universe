"use client";
import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("Dashboard render crashed:", error);
  }, [error]);

  return (
    <div
      style={{
        padding: "3rem 1.5rem",
        maxWidth: 720,
        margin: "0 auto",
        fontFamily: "ui-monospace, 'Space Mono', monospace",
      }}
    >
      <h1 style={{ fontSize: "1.4rem", marginBottom: "1rem" }}>
        Dashboard a crăpat
      </h1>
      <pre
        style={{
          background: "rgba(0,0,0,0.4)",
          padding: "1rem",
          borderRadius: 6,
          whiteSpace: "pre-wrap",
          fontSize: "0.78rem",
          lineHeight: 1.5,
          border: "1px solid rgba(255,80,80,0.4)",
          color: "#ff9090",
        }}
      >
        {error.message || "(no message)"}
        {error.digest && `\n\ndigest: ${error.digest}`}
        {error.stack && `\n\n${error.stack}`}
      </pre>
      <button
        onClick={reset}
        style={{
          marginTop: "1rem",
          padding: "0.7rem 1.2rem",
          background: "#F5F50A",
          color: "#0B1A2E",
          border: "none",
          fontWeight: 900,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          cursor: "pointer",
        }}
      >
        Reload
      </button>
    </div>
  );
}
