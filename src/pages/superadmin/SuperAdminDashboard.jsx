import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Shield, UserCheck, Ticket, Loader2 } from 'lucide-react';
import { superAdminService } from '../../services/superAdminService';

export default function SuperAdminDashboard() {
  const navigate = useNavigate();

  const [tenants, setTenants]   = useState([]);
  const [admins, setAdmins]     = useState([]);
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const [t, a, u] = await Promise.all([
          superAdminService.getTenants(),
          superAdminService.getAdmins(),
          superAdminService.getUsers(),
        ]);
        if (cancelled) return;
        setTenants(Array.isArray(t) ? t : (t?.items ?? []));
        setAdmins(Array.isArray(a)  ? a : (a?.items ?? []));
        setUsers(Array.isArray(u)   ? u : (u?.items ?? []));
      } catch (err) {
        if (!cancelled) setError('Failed to load dashboard data.');
        console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const activeUsers   = users.filter(u => u.is_active).length;
  const recentTenants = [...tenants]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

  const widgets = [
    { label: 'Total Tenants', value: loading ? '—' : tenants.length,    icon: Building2, color: '#2563EB', bg: '#EFF6FF' },
    { label: 'Total Admins',  value: loading ? '—' : admins.length,     icon: Shield,    color: '#7C3AED', bg: '#F3E8FF' },
    { label: 'Active Users',  value: loading ? '—' : activeUsers,       icon: UserCheck, color: '#059669', bg: '#ECFDF5' },
    { label: 'Total Users',   value: loading ? '—' : users.length,      icon: Ticket,    color: '#D97706', bg: '#FFFBEB' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 700 }}>Dashboard</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13.5, marginTop: 2 }}>
          Overview of your multi-tenant CRM platform
        </p>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 'var(--radius-sm)', fontSize: 13, color: '#DC2626' }}>
          {error}
        </div>
      )}

      {/* Stat widgets */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {widgets.map((w, i) => {
          const Icon = w.icon;
          return (
            <div key={w.label} className="card animate-in"
              style={{ padding: '20px 24px', animationDelay: `${i * 0.07}s`, transition: 'box-shadow 0.2s, transform 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.transform = ''; }}
            >
              <div style={{ marginBottom: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: w.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={20} color={w.color} />
                </div>
              </div>
              <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px', lineHeight: 1 }}>
                {loading ? <Loader2 size={20} style={{ animation: 'spin 1s linear infinite', color: 'var(--text-muted)' }} /> : w.value}
              </div>
              <div style={{ marginTop: 6, fontSize: 13.5, color: 'var(--text-secondary)' }}>{w.label}</div>
            </div>
          );
        })}
      </div>

      {/* Recent Tenants + Admins summary */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16 }}>

        {/* Recent Tenants */}
        <div className="card animate-in" style={{ padding: 24, animationDelay: '0.28s' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600 }}>Recent Tenants</h3>
            <button onClick={() => navigate('/superadmin/tenants')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--primary)', fontWeight: 500, fontFamily: 'inherit' }}>
              View All
            </button>
          </div>

          {loading ? (
            <LoadingRows count={5} />
          ) : recentTenants.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>No tenants yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {recentTenants.map(t => (
                <div key={t.id}
                  style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 10px', borderRadius: 'var(--radius-sm)', transition: 'background 0.15s', cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Building2 size={18} color="white" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t.slug}</div>
                  </div>
                  <span style={{
                    padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600,
                    background: t.is_active ? '#ECFDF5' : '#FEF2F2',
                    color:      t.is_active ? '#059669' : '#DC2626',
                  }}>
                    {t.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Admins summary */}
        <div className="card animate-in" style={{ padding: 24, animationDelay: '0.35s' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600 }}>Recent Admins</h3>
            <button onClick={() => navigate('/superadmin/admins')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--primary)', fontWeight: 500, fontFamily: 'inherit' }}>
              View All
            </button>
          </div>

          {loading ? (
            <LoadingRows count={4} />
          ) : admins.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>No admins yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {admins.slice(0, 5).map(a => (
                <div key={a.id} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', background: '#7C3AED',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <Shield size={14} color="white" />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.email}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                      {a.is_active ? '● Active' : '● Inactive'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function LoadingRows({ count }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ height: 36, borderRadius: 8, background: 'var(--surface-2)', animation: 'pulse 1.5s ease-in-out infinite', opacity: 0.6 }} />
      ))}
    </div>
  );
}