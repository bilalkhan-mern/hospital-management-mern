export const buildLastNDaysSeries = (records = [], days = 7) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const series = [];
  const recordMap = new Map(records.map((item) => [item._id, item.count]));

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const current = new Date(today);
    current.setDate(today.getDate() - offset);
    const key = current.toISOString().slice(0, 10);

    series.push({
      date: key,
      label: current.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      count: recordMap.get(key) || 0,
    });
  }

  return series;
};

export const buildStatusDistribution = (records = []) => {
  const base = {
    pending: 0,
    completed: 0,
    cancelled: 0,
  };

  records.forEach((item) => {
    if (Object.prototype.hasOwnProperty.call(base, item._id)) {
      base[item._id] = item.count;
    }
  });

  return Object.entries(base).map(([status, value]) => ({
    status,
    value,
  }));
};
