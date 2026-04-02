import { useNavigate } from 'react-router-dom';
import { Building2, Shield, UserCheck, Ticket, UserPlus, Clock } from 'lucide-react';

const RECENT_TENANTS = [
  { id: 1, name: 'Global Industries Corp', domain: 'globalindustries.crm.com' },
  { id: 2, name: 'TechBridge Solutions',   domain: 'techbridge.crm.com'       },
  { id: 3, name: 'Innovation Labs Inc',    domain: 'innovationlabs.crm.com'   },
  { id: 4, name: 'Digital Dynamics',       domain: 'digitaldynamics.crm.com'  },
  { id: 5, name: 'CloudTech Services',     domain: 'cloudtech.crm.com'        },
];

const SYSTEM_ACTIVITY = [
  { icon: Building2, color: '#2563EB', bg: '#EFF6FF', title: 'New tenant registered', sub: 'Global Industries Corp', time: '2 hours ago' },
  { icon: UserPlus,  color: '#059669', bg: '#ECFDF5', title: 'Admin user added',       sub: 'TechBridge Solutions',   time: '5 hours ago' },
];

export default function SuperAdminDashboard({ stats = {}, tenants = RECENT_TENANTS, activity = SYSTEM_ACTIVITY }) {
  const navigate = useNavigate();

  const widgets = [
    { label: 'Total Tenants', value: stats.total_tenants  ?? 24,      icon: Building2, color: '#2563EB', bg: '#EFF6FF' },
    { label: 'Total Admins',  value: stats.total_admins   ?? 56,      icon: Shield,    color: '#7C3AED', bg: '#F3E8FF' },
    { label: 'Active Users',  value: stats.active_users   ?? '1,247', icon: UserCheck, color: '#059669', bg: '#ECFDF5' },
    { label: 'Total Tickets', value: stats.total_tickets  ?? '45,234',icon: Ticket,    color: '#D97706', bg: '#FFFBEB' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 700 }}>Dashboard</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13.5, marginTop: 2 }}>
          Overview of your multi-tenant CRM platform
        </p>
      </div>

      {/* Stat widgets — no up arrow, no change text */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {widgets.map((w, i) => {
          const Icon = w.icon;
          return (
            <div
              key={w.label}
              className="card animate-in"
              style={{ padding: '20px 24px', animationDelay: `${i * 0.07}s`, transition: 'box-shadow 0.2s, transform 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.transform = ''; }}
            >
              <div style={{ marginBottom: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: w.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={20} color={w.color} />
                </div>
              </div>
              <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px', lineHeight: 1 }}>{w.value}</div>
              <div style={{ marginTop: 6, fontSize: 13.5, color: 'var(--text-secondary)' }}>{w.label}</div>
            </div>
          );
        })}
      </div>

      {/* Recent Tenants + System Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16 }}>

        {/* Recent Tenants — name + domain only, NO status badge */}
        <div className="card animate-in" style={{ padding: 24, animationDelay: '0.28s' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600 }}>Recent Tenants</h3>
            <button
              onClick={() => navigate('/superadmin/tenants')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--primary)', fontWeight: 500, fontFamily: 'inherit' }}
            >
              View All
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {tenants.map(t => (
              <div
                key={t.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '12px 10px', borderRadius: 'var(--radius-sm)',
                  transition: 'background 0.15s', cursor: 'pointer',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{
                  width: 38, height: 38, borderRadius: 10, background: 'var(--primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Building2 size={18} color="white" />
                </div>
                {/* Name and domain only — no badge */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{t.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t.domain}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Activity */}
        <div className="card animate-in" style={{ padding: 24, animationDelay: '0.35s' }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>System Activity</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {activity.map((a, i) => {
              const Icon = a.icon;
              return (
                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: '50%', background: a.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <Icon size={15} color={a.color} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 600 }}>{a.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{a.sub}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={10} /> {a.time}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}