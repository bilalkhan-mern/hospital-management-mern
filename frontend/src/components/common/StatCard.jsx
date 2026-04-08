const StatCard = ({ title, value, tone = 'brand' }) => {
  const tones = {
    brand: 'from-teal-500 to-brand-700',
    accent: 'from-orange-400 to-accent',
    dark: 'from-slate-700 to-slate-950',
  };

  return (
    <div className={`min-w-0 rounded-3xl bg-gradient-to-br ${tones[tone]} p-[1px] shadow-soft`}>
      <div className="rounded-[calc(1.5rem-1px)] bg-white px-4 py-5 sm:px-5 sm:py-6">
        <p className="truncate text-sm font-medium text-slate-500">{title}</p>
        <h3 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:mt-3 sm:text-3xl">{value}</h3>
      </div>
    </div>
  );
};

export default StatCard;
