import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, Globe, MapPin, Ticket, Database, Calendar } from 'lucide-react';
import { accountService } from '../../services/accountService';
import { ACCOUNTS_DATA } from './Accounts';
import { crmBadgeClass, formatDate, getInitials, getAvatarColor, statusBadgeClass, priorityBadgeClass } from '../../utils/helpers';

const CUSTOMERS_BY_ACCOUNT = {
  1: [{ id: 1, name: 'David Lee',   email: 'david.lee@globalindustries.com',  phone: '+1 (555) 333-4444', tickets: 12 }, { id: 8, name: 'Carlos Martinez', email: 'carlos.m@globalindustries.com', phone: '+1 (555) 000-1111', tickets: 9 }],
  2: [{ id: 2, name: 'Alex Brown',  email: 'alex.brown@digitaldynamics.com',  phone: '+1 (555) 444-5555', tickets: 3  }],
  3: [{ id: 3, name: 'Sarah Kim',   email: 'sarah.kim@innovationlabs.com',    phone: '+1 (555) 555-6666', tickets: 10 }, { id: 10, name: 'James Wilson', email: 'james.w@innovationlabs.com', phone: '+1 (555) 222-3333', tickets: 8 }],
  4: [{ id: 4, name: 'Michael Chen',email: 'michael.chen@cloudtech.com',      phone: '+1 (555) 666-7777', tickets: 2  }],
  5: [{ id: 5, name: 'Lisa Anderson',email: 'lisa.a@esg.com',                 phone: '+1 (555) 777-8888', tickets: 15 }],
  6: [{ id: 7, name: 'Rachel Green',email: 'rachel.green@nexustech.io',       phone: '+1 (555) 999-0000', tickets: 7  }],
  7: [{ id: 6, name: 'Tom Wilson',  email: 'tom.w@acmecorp.com',              phone: '+1 (555) 888-9999', tickets: 6  }],
  8: [{ id: 9, name: 'Emma Johnson',email: 'emma.j@techbridge.com',           phone: '+1 (555) 111-2222', tickets: 4  }],
};

const TICKETS_BY_ACCOUNT = {
  1: [{ id: 11, crm_id: 'ESPO-1252', title: 'Server timeout errors',          status: 'Open',        priority: 'Urgent', crm: 'EspoCRM' }, { id: 5, crm_id: 'ESPO-1248', title: 'Email notifications not sending', status: 'Open', priority: 'High', crm: 'EspoCRM' }],
  2: [{ id: 1,  crm_id: 'ESPO-1247', title: 'Login page not loading',         status: 'Open',        priority: 'Urgent', crm: 'EspoCRM' }],
  3: [{ id: 2,  crm_id: 'ZMD-3456',  title: 'Add dark mode support',          status: 'In Progress', priority: 'Medium', crm: 'Zammad'  }],
  4: [{ id: 4,  crm_id: 'ZMD-3457',  title: 'Performance issue on dashboard', status: 'In Progress', priority: 'High',   crm: 'Zammad'  }],
  5: [],
  6: [{ id: 6,  crm_id: 'ZMD-3458',  title: 'Export CSV feature request',     status: 'Closed',      priority: 'Low',    crm: 'Zammad'  }],
  7: [],
  8: [],
};

export default function AccountDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [account, setAccount] = useState(null);

  useEffect(() => {
    accountService.getById(id)
      .then(r => setAccount(r.data))
      .catch(() => setAccount(ACCOUNTS_DATA.find(a => a.id === Number(id)) || ACCOUNTS_DATA[0]));
  }, [id]);

  if (!account) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: 'var(--primary)', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const customers = CUSTOMERS_BY_ACCOUNT[account.id] || [];
  const tickets   = TICKETS_BY_ACCOUNT[account.id]   || [];

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={() => navigate('/admin/accounts')} className="btn btn-ghost" style={{ padding: '6px 10px' }}>
          <ArrowLeft size={16} /> Back
        </button>
        <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
          <a href="/admin/accounts" style={{ color: 'var(--text-muted)' }}>Accounts</a> › {account.name}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16, alignItems: 'start' }}>
        {/* Left */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Header card */}
          <div className="card animate-in" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              <div style={{ width: 56, height: 56, borderRadius: 14, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: 'var(--primary)', flexShrink: 0 }}>
                {getInitials(account.name)}
              </div>
              <div>
                <h1 style={{ fontSize: 20, fontWeight: 700 }}>{account.name}</h1>
                {account.industry && <div style={{ fontSize: 13.5, color: 'var(--text-secondary)', marginTop: 3 }}>{account.industry}</div>}
              </div>
              <div style={{ marginLeft: 'auto' }}>
                <span className={crmBadgeClass(account.crm)}>{account.crm}</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {account.email && (
                <a href={`mailto:${account.email}`} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, color: 'var(--primary)', textDecoration: 'none' }}>
                  <Mail size={15} /> {account.email}
                </a>
              )}
              {account.phone && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, color: 'var(--text-secondary)' }}>
                  <Phone size={15} /> {account.phone}
                </div>
              )}
              {account.website && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, color: 'var(--text-secondary)' }}>
                  <Globe size={15} /> {account.website}
                </div>
              )}
              {account.address && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, color: 'var(--text-secondary)' }}>
                  <MapPin size={15} /> {account.address}
                </div>
              )}
            </div>
          </div>

          {/* Customers */}
          <div className="card animate-in" style={{ padding: 24, animationDelay: '0.05s' }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Customers ({customers.length})</h3>
            {customers.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: 13.5, textAlign: 'center', padding: '20px 0' }}>No customers found</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {customers.map((c, i) => (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < customers.length - 1 ? '1px solid var(--border-light)' : 'none', cursor: 'pointer' }}
                    onClick={() => navigate(`/admin/customers/${c.id}`)}
                  >
                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: getAvatarColor(c.name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                      {getInitials(c.name)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13.5 }}>{c.name}</div>
                      <a href={`mailto:${c.email}`} onClick={e => e.stopPropagation()} style={{ fontSize: 12.5, color: 'var(--primary)' }}>{c.email}</a>
                    </div>
                    <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{c.tickets} tickets</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tickets */}
          <div className="card animate-in" style={{ padding: 24, animationDelay: '0.1s' }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Recent Tickets ({tickets.length})</h3>
            {tickets.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: 13.5, textAlign: 'center', padding: '20px 0' }}>No tickets found</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {tickets.map((t, i) => (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < tickets.length - 1 ? '1px solid var(--border-light)' : 'none', cursor: 'pointer' }}
                    onClick={() => navigate(`/admin/tickets/${t.id}`)}
                  >
                    <div style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--primary)', flexShrink: 0 }}>
                      #{t.id}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13.5 }}>{t.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t.crm_id}</div>
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
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 18 }}>Account Details</div>

          {[
            { icon: Database,  label: 'CRM Source',    value: <span className={crmBadgeClass(account.crm)}>{account.crm}</span> },
            { icon: Ticket,    label: 'Total Tickets',  value: <span style={{ fontWeight: 700, fontSize: 18 }}>{account.tickets}</span> },
            { icon: Calendar,  label: 'Last Updated',   value: <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{formatDate(account.updated)}</span> },
          ].map(({ icon: Icon, label, value }) => (
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
