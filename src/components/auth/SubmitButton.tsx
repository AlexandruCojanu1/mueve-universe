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
    <button type="submit" disabled={loading} className="auth-submit-btn">
      {loading ? loadingLabel ?? "…" : children}
    </button>
  );
}
