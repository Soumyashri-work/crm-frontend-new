import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, Database, AlertTriangle } from 'lucide-react';
import { accountService } from '../../services/accountService';
import { crmBadgeClass, getInitials } from '../../utils/helpers';

export default function AccountDetail() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const fetchAccount = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await accountService.getById(id);
      setAccount(data);
    } catch (err) {
      setError('Could not load account.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAccount(); }, [id]);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: 'var(--primary)', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (error) return (
    <div style={{ maxWidth: 520, margin: '40px auto' }}>
      <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 'var(--radius)', padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center' }}>
        <AlertTriangle size={32} color="#DC2626" />
        <div style={{ fontWeight: 600, color: '#DC2626' }}>{error}</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-outline" onClick={() => navigate('/admin/accounts')}><ArrowLeft size={15} /> Back</button>
          <button className="btn btn-primary" onClick={fetchAccount}>Retry</button>
        </div>
      </div>
    </div>
  );

  if (!account) return null;

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Back */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={() => navigate('/admin/accounts')} className="btn btn-ghost" style={{ padding: '6px 10px' }}>
          <ArrowLeft size={16} /> Back
        </button>
        <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
          <span onClick={() => navigate('/admin/accounts')} style={{ cursor: 'pointer', color: 'var(--text-muted)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--primary)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
            Accounts
          </span>
          {' › '}{account.name}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 16, alignItems: 'start' }}>

        {/* Left — main card */}
        <div className="card animate-in" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: 'var(--primary)', flexShrink: 0 }}>
              {getInitials(account.name)}
            </div>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{account.name}</h1>
              <span className={crmBadgeClass(account.crm)}>{account.crm}</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {account.email && (
              <a href={`mailto:${account.email}`} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'var(--primary)', textDecoration: 'none' }}>
                <Mail size={15} /> {account.email}
              </a>
            )}
            {account.phone && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'var(--text-secondary)' }}>
                <Phone size={15} /> {account.phone}
              </div>
            )}
          </div>
        </div>

        {/* Right — sidebar */}
        <div className="card animate-in" style={{ padding: 20, animationDelay: '0.08s' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 18 }}>
            Details
          </div>

          {/* CRM ID */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>CRM ID</div>
            <div style={{ fontSize: 13, fontWeight: 500, fontFamily: 'monospace' }}>{account.crm_id || '—'}</div>
          </div>

          {/* CRM Source */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>
              <Database size={11} /> CRM Source
            </div>
            <span className={crmBadgeClass(account.crm)}>{account.crm}</span>
          </div>

          {/* Email */}
          {account.email && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>Email</div>
              <a href={`mailto:${account.email}`} style={{ fontSize: 13.5, color: 'var(--primary)', textDecoration: 'none' }}>{account.email}</a>
            </div>
          )}

          {/* Phone */}
          {account.phone && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>Phone</div>
              <div style={{ fontSize: 13.5 }}>{account.phone}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}