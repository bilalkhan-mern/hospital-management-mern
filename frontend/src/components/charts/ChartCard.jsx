const ChartCard = ({ title, description, children, loading = false, empty = false, emptyText = 'No data available yet.' }) => (
  <div className="card">
    <div>
      <h2 className="section-title">{title}</h2>
      <p className="section-copy">{description}</p>
    </div>
    <div className="mt-5">
      {loading ? (
        <div className="flex h-[280px] items-center justify-center rounded-[24px] border border-slate-200 bg-slate-50 text-sm text-slate-500">
          Loading chart...
        </div>
      ) : empty ? (
        <div className="flex h-[280px] items-center justify-center rounded-[24px] border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
          {emptyText}
        </div>
      ) : (
        <div className="h-[280px] w-full">{children}</div>
      )}
    </div>
  </div>
);

export default ChartCard;
