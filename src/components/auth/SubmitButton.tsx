"use client";

export default function SubmitButton({
  loading,
  children,
  loadingLabel,
}: {
  loading?: boolean;
  children: React.ReactNode;
  loadingLabel?: string;
}) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full rounded-xl font-black uppercase tracking-[0.22em] text-xs transition disabled:opacity-50"
      style={{
        height: "54px",
        background: "var(--sun)",
        color: "var(--deep)",
        boxShadow: "0 18px 40px -12px rgba(245,221,90,0.6)",
      }}
    >
      {loading ? loadingLabel ?? "…" : children}
    </button>
  );
}
