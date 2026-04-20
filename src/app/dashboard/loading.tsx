export default function DashboardLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="h-10 w-1/3 bg-white/5 rounded" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-28 bg-white/5 rounded-lg" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[0, 1].map((i) => (
          <div key={i} className="h-44 bg-white/5 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
