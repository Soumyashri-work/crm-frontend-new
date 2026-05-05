import { Ticket, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

const WIDGETS = [
  {
    key: 'total',
    label: 'Total Tickets',
    value: '1,247',
    change: '+12.5%',
    up: true,
    icon: Ticket,
    color: 'var(--primary)',
    bg: 'var(--primary-light)',
  },
  {
    key: 'open',
    label: 'Open Tickets',
    value: '342',
    change: '+8.2%',
    up: true,
    icon: AlertCircle,
    color: 'var(--warning)',
    bg: 'var(--warning-light)',
  },
  {
    key: 'closed',
    label: 'Closed Tickets',
    value: '835',
    change: '+15.3%',
    up: true,
    icon: CheckCircle2,
    color: 'var(--success)',
    bg: 'var(--success-light)',
  },
  {
    key: 'high',
    label: 'High Priority',
    value: '87',
    change: '-5.1%',
    up: false,
    icon: Clock,
    color: 'var(--danger)',
    bg: 'var(--danger-light)',
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
    <div className="widget-grid">
      {widgets.map((w, i) => {
        const Icon = w.icon;
        return (
          <div
            key={w.key}
            className="card animate-in widget-card"
            style={{ animationDelay: `${i * 0.07}s` }}
            onMouseEnter={e => { 
              e.currentTarget.style.boxShadow = 'var(--shadow-md)'; 
              e.currentTarget.style.transform = 'translateY(-2px)'; 
            }}
            onMouseLeave={e => { 
              e.currentTarget.style.boxShadow = ''; 
              e.currentTarget.style.transform = ''; 
            }}
          >
            <div className="flex-between" style={{ marginBottom: 'var(--space-lg)' }}>
              <div 
                className="widget-icon-box"
                style={{ background: w.bg }}
              >
                <Icon size={20} color={w.color} />
              </div>
            </div>
            <div className="widget-value">
              {w.value}
            </div>
            <div className="widget-label">
              {w.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}