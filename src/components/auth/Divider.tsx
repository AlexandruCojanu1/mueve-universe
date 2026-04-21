export default function Divider({ label }: { label: string }) {
  return (
    <div className="auth-divider">
      <span className="auth-divider-line" />
      <span className="auth-divider-label">{label}</span>
      <span className="auth-divider-line" />
    </div>
  );
}
