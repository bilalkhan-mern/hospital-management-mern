const InlineLoader = ({ label = 'Loading...' }) => (
  <div className="flex items-center justify-center rounded-[20px] border border-slate-200 bg-white/80 px-4 py-10 text-sm font-medium text-slate-500">
    {label}
  </div>
);

export default InlineLoader;
