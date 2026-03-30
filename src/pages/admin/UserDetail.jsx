import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Mail, Phone, Shield, Calendar, Database, AlertTriangle } from 'lucide-react';
import { userService, userKeys } from '../../services/userService';
import { crmBadgeClass, getInitials, getAvatarColor, formatDate } from '../../utils/helpers';

export default function UserDetail() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // If navigated from the Users list the row is in router state —
  // use it as initialData so the page renders immediately.
  const preloaded = location.state?.user ?? undefined;

  const {
    data:     user,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey:    userKeys.detail(id),
    queryFn:     () => userService.getById(id),
    initialData: preloaded,
    initialDataUpdatedAt: preloaded ? Date.now() : undefined,
    staleTime:   30_000,
  });

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: 'var(--primary)', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  // ── Error ─────────────────────────────────────────────────────────────────
  if (isError && !user) return (
    <div style={{ maxWidth: 520, margin: '40px auto' }}>
      <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 'var(--radius)', padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center' }}>
        <AlertTriangle size={32} color="#DC2626" />
        <div style={{ fontWeight: 600, color: '#DC2626' }}>
          {error?.message ?? 'Could not load user.'}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-outline" onClick={() => navigate('/admin/users')}>
            <ArrowLeft size={15} /> Back
          </button>
          <button className="btn btn-primary" onClick={() => refetch()}>Retry</button>
        </div>
      </div>
    </div>
  );

  if (!user) return null;

  const isAdmin = (user.role || '').toLowerCase() === 'admin';

  return (
    <div style={{ margin: '0 auto', padding: '0 40px', display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={() => navigate('/admin/users')} className="btn btn-ghost" style={{ padding: '6px 10px' }}>
          <ArrowLeft size={16} /> Back
        </button>
        <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
          <span
            onClick={() => navigate('/admin/users')}
            style={{ cursor: 'pointer', color: 'var(--text-muted)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--primary)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            Users
          </span>
          {' › '}{user.name}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, alignItems: 'start' }}>

        {/* Left — profile */}
        <div className="card animate-in" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%', flexShrink: 0,
              background: getAvatarColor(user.name),
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24, fontWeight: 700, color: 'white',
            }}>
              {getInitials(user.name)}
            </div>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 700 }}>{user.name}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                <span className={`badge ${isAdmin ? 'badge-admin' : 'badge-agent'}`}>{user.role}</span>
                <span className={`badge ${(user.status || '').toLowerCase() === 'active' ? 'badge-active' : 'badge-inactive'}`}>
                  {user.status || 'Active'}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {user.email && (
              <a href={`mailto:${user.email}`} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'var(--primary)', textDecoration: 'none' }}>
                <Mail size={15} /> {user.email}
              </a>
            )}
            {user.phone && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'var(--text-secondary)' }}>
                <Phone size={15} /> {user.phone}
              </div>
            )}
            {user.joined && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'var(--text-secondary)' }}>
                <Calendar size={15} /> Joined {formatDate(user.joined)}
              </div>
            )}
          </div>
        </div>

        {/* Right — sidebar */}
        <div className="card animate-in" style={{ padding: 20, animationDelay: '0.08s' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 18 }}>
            User Details
          </div>

          {[
            {
              icon: Shield, label: 'Role',
              value: <span className={`badge ${isAdmin ? 'badge-admin' : 'badge-agent'}`}>{user.role || '—'}</span>,
            },
            user.crm && {
              icon: Database, label: 'CRM',
              value: <span className={crmBadgeClass(user.crm)}>{user.crm}</span>,
            },
            {
              icon: Calendar, label: 'Member Since',
              value: <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{formatDate(user.joined) || '—'}</span>,
            },
          ].filter(Boolean).map(({ icon: Icon, label, value }) => (
            <div key={label} style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: 5 }}>
                <Icon size={11} /> {label}
              </div>
              {value}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
