import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const pieColors = {
  pending: '#f59e0b',
  completed: '#0f766e',
  cancelled: '#ef4444',
};

export const AppointmentsLineChart = ({ data = [], dataKey = 'count' }) => (
  <ResponsiveContainer width="100%" height="100%">
    <LineChart data={data}>
      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
      <XAxis dataKey="label" stroke="#64748b" tickLine={false} axisLine={false} />
      <YAxis allowDecimals={false} stroke="#64748b" tickLine={false} axisLine={false} />
      <Tooltip />
      <Line type="monotone" dataKey={dataKey} stroke="#0f766e" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
    </LineChart>
  </ResponsiveContainer>
);

export const AppointmentStatusPieChart = ({ data = [] }) => (
  <ResponsiveContainer width="100%" height="100%">
    <PieChart>
      <Pie data={data} dataKey="value" nameKey="status" innerRadius={60} outerRadius={90} paddingAngle={4}>
        {data.map((entry) => (
          <Cell key={entry.status} fill={pieColors[entry.status] || '#334155'} />
        ))}
      </Pie>
      <Tooltip />
      <Legend />
    </PieChart>
  </ResponsiveContainer>
);

export const AppointmentsBarChart = ({ data = [], dataKey = 'count' }) => (
  <ResponsiveContainer width="100%" height="100%">
    <BarChart data={data}>
      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
      <XAxis dataKey="label" stroke="#64748b" tickLine={false} axisLine={false} />
      <YAxis allowDecimals={false} stroke="#64748b" tickLine={false} axisLine={false} />
      <Tooltip />
      <Bar dataKey={dataKey} fill="#0f766e" radius={[10, 10, 0, 0]} />
    </BarChart>
  </ResponsiveContainer>
);
