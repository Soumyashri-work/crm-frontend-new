import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, Building2, Ticket } from 'lucide-react';
import { customerService } from '../../services/customerService';
import { CUSTOMERS_DATA } from './Customers';
import { crmBadgeClass, getInitials, getAvatarColor, statusBadgeClass, priorityBadgeClass, formatDateTime } from '../../utils/helpers';

const TICKETS_BY_CUSTOMER = {
  1: [{ id: 11, crm_id: 'ESPO-1252', title: 'Server timeout errors',          status: 'Open',        priority: 'Urgent', crm: 'EspoCRM', updated: new Date(Date.now()-3600000).toISOString() }, { id: 5, crm_id: 'ESPO-1248', title: 'Email notifications not sending', status: 'Open', priority: 'High', crm: 'EspoCRM', updated: new Date(Date.now()-18000000).toISOString() }],
  2: [{ id: 1,  crm_id: 'ESPO-1247', title: 'Login page not loading',         status: 'Open',        priority: 'Urgent', crm: 'EspoCRM', updated: new Date(Date.now()-7200000).toISOString()  }],
  3: [{ id: 2,  crm_id: 'ZMD-3456',  title: 'Add dark mode support',          status: 'In Progress', priority: 'Medium', crm: 'Zammad',  updated: new Date(Date.now()-10800000).toISOString() }],
  4: [{ id: 4,  crm_id: 'ZMD-3457',  title: 'Performance issue on dashboard', status: 'In Progress', priority: 'High',   crm: 'Zammad',  updated: new Date(Date.now()-14400000).toISOString() }],
  5: [],
  6: [],
  7: [{ id: 6,  crm_id: 'ZMD-3458',  title: 'Export CSV feature request',     status: 'Closed',      priority: 'Low',    crm: 'Zammad',  updated: new Date(Date.now()-86400000).toISOString() }],
  8: [],
  9: [],
  10: [],
};

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);

  useEffect(() => {
    customerService.getById(id)
      .then(r => setCustomer(r.data))
      .catch(() => setCustomer(CUSTOMERS_DATA.find(c => c.id === Number(id)) || CUSTOMERS_DATA[0]));
  }, [id]);

  if (!customer) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: 'var(--primary)', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const tickets = TICKETS_BY_CUSTOMER[customer.id] || [];

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={() => navigate('/admin/customers')} className="btn btn-ghost" style={{ padding: '6px 10px' }}>
          <ArrowLeft size={16} /> Back
        </button>
        <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
          <a href="/admin/customers" style={{ color: 'var(--text-muted)' }}>Customers</a> › {customer.name}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 16, alignItems: 'start' }}>
        {/* Left */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Profile card */}
          <div className="card animate-in" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              <div style={{ width: 60, height: 60, borderRadius: '50%', background: getAvatarColor(customer.name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                {getInitials(customer.name)}
              </div>
              <div>
                <h1 style={{ fontSize: 20, fontWeight: 700 }}>{customer.name}</h1>
                <span className={crmBadgeClass(customer.crm)} style={{ marginTop: 4, display: 'inline-block' }}>{customer.crm}</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
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
              {customer.account && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'var(--text-secondary)', cursor: 'pointer' }}
                  onClick={() => navigate(`/admin/accounts/${customer.accountId}`)}>
                  <Building2 size={15} />
                  <span style={{ color: 'var(--primary)', fontWeight: 500 }}>{customer.account}</span>
                </div>
              )}
            </div>
          </div>

          {/* Tickets */}
          <div className="card animate-in" style={{ padding: 24, animationDelay: '0.06s' }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>
              Tickets ({tickets.length})
            </h3>
            {tickets.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: 13.5, textAlign: 'center', padding: '20px 0' }}>No tickets found</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {tickets.map((t, i) => (
                  <div key={t.id}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: i < tickets.length - 1 ? '1px solid var(--border-light)' : 'none', cursor: 'pointer' }}
                    onClick={() => navigate(`/admin/tickets/${t.id}`)}
                  >
                    <div style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--primary)', flexShrink: 0 }}>
                      #{t.id}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13.5 }}>{t.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t.crm_id} · {formatDateTime(t.updated)}</div>
                    </div>
                    <span className={statusBadgeClass(t.status)}>{t.status}</span>
                    <span className={priorityBadgeClass(t.priority)}>{t.priority}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right sidebar */}
        <div className="card animate-in" style={{ padding: 20, animationDelay: '0.08s' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 18 }}>Summary</div>

          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>Total Tickets</div>
            <div style={{ fontWeight: 700, fontSize: 22 }}>{customer.tickets}</div>
          </div>

          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>CRM Source</div>
            <span className={crmBadgeClass(customer.crm)}>{customer.crm}</span>
          </div>

          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>Account</div>
            <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--primary)', cursor: 'pointer' }}
              onClick={() => navigate(`/admin/accounts/${customer.accountId}`)}>
              {customer.account}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
