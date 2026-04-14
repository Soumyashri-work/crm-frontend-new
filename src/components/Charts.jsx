import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const STATUS_DATA = [
  { name: 'Open',    value: 342, color: '#2563EB' },
  { name: 'Closed',  value: 835, color: '#10B981' },
  { name: 'Pending', value: 70,  color: '#F59E0B' },
];

const PRIORITY_DATA = [
  { name: 'Low',    tickets: 320, color: '#10B981' },
  { name: 'Medium', tickets: 487, color: '#2563EB' },
  { name: 'High',   tickets: 283, color: '#F59E0B' },
  { name: 'Urgent', tickets: 157, color: '#EF4444' },
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
    <div className="charts-grid" style={{ marginTop: 16 }}>
      {/* Pie Chart */}
      <div className="card animate-in" style={{ padding: '24px', animationDelay: '0.2s' }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>Tickets by Status</h3>
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
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 8, flexWrap: 'wrap' }}>
          {sd.map(d => (
            <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: d.color, display: 'inline-block', flexShrink: 0 }} />
              <span style={{ color: 'var(--text-secondary)' }}>{d.name}</span>
              <span style={{ fontWeight: 600, color: d.color }}>{Math.round(d.value / sd.reduce((a,b) => a + b.value, 0) * 100)}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bar Chart */}
      <div className="card animate-in" style={{ padding: '24px', animationDelay: '0.28s' }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>Tickets by Priority</h3>
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
                <Cell key={i} fill={entry.color || '#2563EB'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
