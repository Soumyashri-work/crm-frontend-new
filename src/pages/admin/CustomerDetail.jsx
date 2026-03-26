import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Mail, Phone, Database, AlertTriangle } from 'lucide-react';
import { customerService, customerKeys } from '../../services/customerService';
import { crmBadgeClass, getInitials, getAvatarColor } from '../../utils/helpers';

export default function CustomerDetail() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const location   = useLocation();

  // If the user navigated from the Customers list the row object is in
  // router state — use it as initialData so the page renders immediately.
  const preloaded = location.state?.customer ?? undefined;

  const {
    data:     customer,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey:    customerKeys.detail(id),
    queryFn:     () => customerService.getById(id),
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
  if (isError && !customer) return (
    <div style={{ maxWidth: 520, margin: '40px auto' }}>
      <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 'var(--radius)', padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center' }}>
        <AlertTriangle size={32} color="#DC2626" />
        <div style={{ fontWeight: 600, color: '#DC2626' }}>
          {error?.message ?? 'Could not load customer.'}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-outline" onClick={() => navigate('/admin/customers')}>
            <ArrowLeft size={15} /> Back
          </button>
          <button className="btn btn-primary" onClick={() => refetch()}>Retry</button>
        </div>
      </div>
    </div>
  );

  if (!customer) return null;

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Back / breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={() => navigate('/admin/customers')} className="btn btn-ghost" style={{ padding: '6px 10px' }}>
          <ArrowLeft size={16} /> Back
        </button>
        <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
          <span
            onClick={() => navigate('/admin/customers')}
            style={{ cursor: 'pointer', color: 'var(--text-muted)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--primary)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            Customers
          </span>
          {' › '}{customer.name}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 16, alignItems: 'start' }}>

        {/* Left — profile */}
        <div className="card animate-in" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: getAvatarColor(customer.name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: 'white', flexShrink: 0 }}>
              {getInitials(customer.name)}
            </div>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{customer.name}</h1>
              <span className={crmBadgeClass(customer.crm)}>{customer.crm}</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {customer.email && (
              <a href={`mailto:${customer.email}`} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'var(--primary)', textDecoration: 'none' }}>
                <Mail size={15} /> {customer.email}
              </a>
            )}
            {customer.phone && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'var(--text-secondary)' }}>
                <Phone size={15} /> {customer.phone}
              </div>
            )}
            {/* Account link removed — accounts page disabled under multi-tenancy */}
          </div>
        </div>

        {/* Right — sidebar */}
        <div className="card animate-in" style={{ padding: 20, animationDelay: '0.08s' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 18 }}>
            Details
          </div>

          {/* CRM Source */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>
              <Database size={11} /> CRM Source
            </div>
            <span className={crmBadgeClass(customer.crm)}>{customer.crm}</span>
          </div>

          {/* First name */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>
              First Name
            </div>
            <div style={{ fontSize: 13.5 }}>{customer.first_name || '—'}</div>
          </div>

          {/* Last name */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>
              Last Name
            </div>
            <div style={{ fontSize: 13.5 }}>{customer.last_name || '—'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
