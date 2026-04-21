export default function DashboardLoading() {
  return (
    <>
      <div className="dash-skel dash-skel-lg" style={{ marginBottom: "2rem" }} />
      <div className="dash-grid-4" style={{ marginBottom: "2rem" }}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="dash-skel dash-skel-stat" />
        ))}
      </div>
      <div className="dash-grid-2">
        {[0, 1].map((i) => (
          <div key={i} className="dash-skel dash-skel-panel" />
        ))}
      </div>
    </>
  );
}
