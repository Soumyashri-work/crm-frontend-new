/**
 * src/pages/superadmin/SuperAdminDashboard.jsx
 *
 * Changes:
 *  ✅ Removed "Add Tenant" and "Add Admin" quick-action buttons and modals
 *  ✅ Status filter label fixed to "All Status" (not "All Statuses")
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Shield, UserCheck, Ticket, Loader2 } from 'lucide-react';
import { superAdminService } from '../../services/superAdminService';
import { StatusBadge, TenantAvatar } from './SuperAdminTenants';
import { getInitials, getAvatarColor } from '../../utils/helpers';

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const [tenants, setTenants] = useState([]);
  const [admins,  setAdmins]  = useState([]);
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  const loadData = async (cancelled = { current: false }) => {
    setLoading(true);
    setError('');
    try {
      const [t, a, u] = await Promise.all([
        superAdminService.getTenants(),
        superAdminService.getAdmins(),
        superAdminService.getUsers(),
      ]);
      if (cancelled.current) return;
      setTenants(Array.isArray(t) ? t : (t?.items ?? []));
      setAdmins(Array.isArray(a)  ? a : (a?.items ?? []));
      setUsers(Array.isArray(u)   ? u : (u?.items ?? []));
    } catch (err) {
      if (!cancelled.current) setError('Failed to load dashboard data.');
    } finally {
      if (!cancelled.current) setLoading(false);
    }
  };

  useEffect(() => {
    const cancelled = { current: false };
    loadData(cancelled);
    return () => { cancelled.current = true; };
  }, []);

  const activeUsers   = users.filter(u => u.is_active).length;
  const recentTenants = [...tenants]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);
  const recentAdmins  = [...admins].slice(0, 5);

  const widgets = [
    { label: 'Total Tenants', value: tenants.length, icon: Building2, color: '#2563EB', bg: '#EFF6FF', onClick: () => navigate('/superadmin/tenants') },
    { label: 'Total Admins',  value: admins.length,  icon: Shield,    color: '#7C3AED', bg: '#F3E8FF', onClick: () => navigate('/superadmin/admins') },
    { label: 'Active Users',  value: activeUsers,    icon: UserCheck, color: '#059669', bg: '#ECFDF5' },
    { label: 'Total Users',   value: users.length,   icon: Ticket,    color: '#D97706', bg: '#FFFBEB' },
  ];

  return (
    <>
      {/* Header — no quick-action buttons */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ margin: 0 }}>Dashboard</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 6 }}>
          Overview of your multi-tenant CRM platform
        </p>
      </div>

      {error && (
        <div style={{ marginBottom: 24, padding: '12px 16px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 'var(--radius-sm)', fontSize: 13, color: '#B91C1C' }}>
          {error}
        </div>
      )}

      {/* 4-col widgets */}
      <div className="widget-grid" style={{ marginBottom: 32 }}>
        {widgets.map((w, i) => {
          const Icon = w.icon;
          return (
            <div
              key={w.label}
              className="card animate-in"
              style={{
                padding: '20px 24px',
                animationDelay: `${i * 0.07}s`,
                transition: 'box-shadow 0.2s, transform 0.2s',
                cursor: w.onClick ? 'pointer' : 'default',
              }}
              onClick={w.onClick}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.transform = ''; }}
            >
              <div style={{ width: 40, height: 40, borderRadius: 10, background: w.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                <Icon size={20} color={w.color} />
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px', lineHeight: 1, color: '#000' }}>
                {loading
                  ? <Loader2 size={20} style={{ animation: 'spin 1s linear infinite', color: 'var(--text-muted)' }} />
                  : w.value
                }
              </div>
              <div style={{ marginTop: 6, fontSize: 13.5, color: 'var(--text-secondary)', fontWeight: 500 }}>{w.label}</div>
            </div>
          );
        })}
      </div>

      {/* Two-panel grid */}
      <div className="sa-recent-grid" style={{ marginTop: 0 }}>

        {/* Recent Tenants */}
        <div className="card animate-in" style={{ padding: 24, animationDelay: '0.28s' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ margin: 0 }}>Recent Tenants</h3>
            <button
              onClick={() => navigate('/superadmin/tenants')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--primary)', fontWeight: 600, fontFamily: 'inherit' }}
            >
              View All
            </button>
          </div>

          {loading ? <LoadingRows count={5} /> : recentTenants.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>No tenants yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {recentTenants.map(t => (
                <div
                  key={t.id}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 8px', borderRadius: 'var(--radius-sm)', transition: 'background 0.15s', cursor: 'pointer' }}
                  onClick={() => navigate('/superadmin/tenants')}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <TenantAvatar name={t.name} size={36} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#000', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</div>
                    {t.slug && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t.slug}</div>}
                  </div>
                  <StatusBadge status={t.is_active ? 'Active' : 'Inactive'} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Admins */}
        <div className="card animate-in" style={{ padding: 24, animationDelay: '0.35s' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ margin: 0 }}>Recent Admins</h3>
            <button
              onClick={() => navigate('/superadmin/admins')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--primary)', fontWeight: 600, fontFamily: 'inherit' }}
            >
              View All
            </button>
          </div>

          {loading ? <LoadingRows count={4} /> : recentAdmins.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>No admins yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {recentAdmins.map(a => {
                const displayName = a.name || a.email || 'Unknown';
                const status = a.is_pending ? 'Pending' : a.is_active ? 'Active' : 'Inactive';
                return (
                  <div
                    key={a.id}
                    style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 8px', borderRadius: 'var(--radius-sm)', transition: 'background 0.15s', cursor: 'pointer' }}
                    onClick={() => navigate('/superadmin/admins')}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{
                      width: 34, height: 34, borderRadius: '50%',
                      background: getAvatarColor(displayName),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', fontSize: 12, fontWeight: 700, flexShrink: 0,
                    }}>
                      {getInitials(displayName)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#000' }}>
                        {a.name || '—'}
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {a.tenant_name || a.email || '—'}
                      </div>
                    </div>
                    <StatusBadge status={status} />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}

function LoadingRows({ count }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ height: 36, borderRadius: 8, background: 'var(--surface-2)', animation: 'pulse 1.5s ease-in-out infinite', opacity: 0.6 }} />
      ))}
      <style>{`@keyframes pulse{0%,100%{opacity:.6}50%{opacity:.2}}`}</style>
    </div>
  );
}