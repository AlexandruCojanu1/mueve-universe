export default function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex-1 h-px bg-white/10" />
      <span className="text-[0.6rem] uppercase tracking-[0.3em] font-bold opacity-55">
        {label}
      </span>
      <div className="flex-1 h-px bg-white/10" />
    </div>
  );
}
