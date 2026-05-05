import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const STATUS_DATA = [
  { name: 'Open',    value: 342, color: 'var(--primary)' },
  { name: 'Closed',  value: 835, color: 'var(--success)' },
  { name: 'Pending', value: 70,  color: 'var(--warning)' },
];

const PRIORITY_DATA = [
  { name: 'Low',    tickets: 320, color: 'var(--success)' },
  { name: 'Medium', tickets: 487, color: 'var(--primary)' },
  { name: 'High',   tickets: 283, color: 'var(--warning)' },
  { name: 'Urgent', tickets: 157, color: 'var(--danger)' },
];

const CUSTOM_LABEL = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
  const RADIAN = Math.PI / 180;
  const r = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  if (percent < 0.06) return null;
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default function Charts({ statusData, priorityData }) {
  const sd = statusData || STATUS_DATA;
  const pd = priorityData || PRIORITY_DATA;

  return (
    <div className="charts-grid" style={{ marginTop: 'var(--space-lg)' }}>
      {/* Pie Chart */}
      <div className="card animate-in chart-card" style={{ animationDelay: '0.2s' }}>
        <h3 className="chart-title">Tickets by Status</h3>
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={sd} cx="50%" cy="50%"
              outerRadius={100} innerRadius={0}
              dataKey="value"
              labelLine={false}
              label={CUSTOM_LABEL}
            >
              {sd.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(val, name) => [val, name]} />
          </PieChart>
        </ResponsiveContainer>
        <div className="chart-legend">
          {sd.map(d => (
            <div key={d.name} className="chart-legend-item">
              <span className="chart-legend-dot" style={{ background: d.color }} />
              <span className="chart-legend-label">{d.name}</span>
              <span className="chart-legend-percent" style={{ color: d.color }}>
                {Math.round(d.value / sd.reduce((a,b) => a + b.value, 0) * 100)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Bar Chart */}
      <div className="card animate-in chart-card" style={{ animationDelay: '0.28s' }}>
        <h3 className="chart-title">Tickets by Priority</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={pd} barSize={36}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13 }}
              cursor={{ fill: 'var(--surface-2)' }}
            />
            <Bar dataKey="tickets" radius={[6, 6, 0, 0]}>
              {pd.map((entry, i) => (
                <Cell key={i} fill={entry.color || 'var(--primary)'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}