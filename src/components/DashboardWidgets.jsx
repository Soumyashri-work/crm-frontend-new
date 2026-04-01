import { Ticket, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

const WIDGETS = [
  {
    key: 'total',
    label: 'Total Tickets',
    value: '1,247',
    change: '+12.5%',
    up: true,
    icon: Ticket,
    color: '#2563EB',
    bg: '#EFF6FF',
  },
  {
    key: 'open',
    label: 'Open Tickets',
    value: '342',
    change: '+8.2%',
    up: true,
    icon: AlertCircle,
    color: '#F59E0B',
    bg: '#FFFBEB',
  },
  {
    key: 'closed',
    label: 'Closed Tickets',
    value: '835',
    change: '+15.3%',
    up: true,
    icon: CheckCircle2,
    color: '#10B981',
    bg: '#F0FDF4',
  },
  {
    key: 'high',
    label: 'High Priority',
    value: '87',
    change: '-5.1%',
    up: false,
    icon: Clock,
    color: '#EF4444',
    bg: '#FEF2F2',
  },
];

export default function DashboardWidgets({ stats }) {
  const widgets = stats ? [
    { ...WIDGETS[0], value: stats.total?.toLocaleString() || WIDGETS[0].value },
    { ...WIDGETS[1], value: stats.open?.toLocaleString()  || WIDGETS[1].value },
    { ...WIDGETS[2], value: stats.closed?.toLocaleString()|| WIDGETS[2].value },
    { ...WIDGETS[3], value: stats.high_priority?.toLocaleString() || WIDGETS[3].value },
  ] : WIDGETS;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
      gap: 16,
    }}>
      {widgets.map((w, i) => {
        const Icon = w.icon;
        return (
          <div
            key={w.key}
            className="card animate-in"
            style={{
              padding: '20px 24px',
              animationDelay: `${i * 0.07}s`,
              cursor: 'default',
              transition: 'box-shadow var(--transition), transform var(--transition)',
            }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.transform = ''; }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: w.bg, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={20} color={w.color} />
              </div>

            </div>
            <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px', lineHeight: 1 }}>
              {w.value}
            </div>
            <div style={{ marginTop: 4, fontSize: 13.5, color: 'var(--text-secondary)' }}>
              {w.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}
