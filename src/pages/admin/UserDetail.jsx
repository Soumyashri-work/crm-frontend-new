import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, Shield, Calendar, Ticket, Database } from 'lucide-react';
import { userService } from '../../services/userService';
import { USERS_DATA } from './Users';
import { crmBadgeClass, getInitials, getAvatarColor, statusBadgeClass, priorityBadgeClass, formatDateTime, formatDate } from '../../utils/helpers';

// Tickets assigned to each user (by user ID)
const TICKETS_BY_USER = {
  1:  [{ id: 11, crm_id: 'ESPO-1252', title: 'Server timeout errors',          status: 'Open',        priority: 'Urgent', crm: 'EspoCRM', updated: new Date(Date.now()-3600000).toISOString()   },
       { id: 5,  crm_id: 'ESPO-1248', title: 'Email notifications not sending', status: 'Open',        priority: 'High',   crm: 'EspoCRM', updated: new Date(Date.now()-18000000).toISOString()  }],
  2:  [],
  3:  [],
  4:  [],
  5:  [],
  6:  [{ id: 4,  crm_id: 'ZMD-3457',  title: 'Performance issue on dashboard',  status: 'In Progress', priority: 'High',   crm: 'Zammad',  updated: new Date(Date.now()-14400000).toISOString()  }],
  7:  [{ id: 1,  crm_id: 'ESPO-1247', title: 'Login page not loading',          status: 'Open',        priority: 'Urgent', crm: 'EspoCRM', updated: new Date(Date.now()-7200000).toISOString()   }],
  8:  [{ id: 2,  crm_id: 'ZMD-3456',  title: 'Add dark mode support',           status: 'In Progress', priority: 'Medium', crm: 'Zammad',  updated: new Date(Date.now()-10800000).toISOString()  },
       { id: 6,  crm_id: 'ZMD-3458',  title: 'Export CSV feature request',      status: 'Closed',      priority: 'Low',    crm: 'Zammad',  updated: new Date(Date.now()-86400000).toISOString()  }],
};

export default function UserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    userService.getById(id)
      .then(r => setUser(r.data))
      .catch(() => setUser(USERS_DATA.find(u => u.id === Number(id)) || USERS_DATA[0]));
  }, [id]);

  if (!user) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: 'var(--primary)', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const tickets = TICKETS_BY_USER[user.id] || [];
  const isAdmin = user.role === 'Admin';

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={() => navigate('/admin/users')} className="btn btn-ghost" style={{ padding: '6px 10px' }}>
          <ArrowLeft size={16} /> Back
        </button>
        <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
          <span onClick={() => navigate('/admin/users')} style={{ cursor: 'pointer', color: 'var(--text-muted)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--primary)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
            Users
          </span>
          {' › '}{user.name}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 16, alignItems: 'start' }}>
        {/* Left */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Profile card */}
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
                  <span className={`badge ${user.status === 'Active' ? 'badge-active' : 'badge-inactive'}`}>{user.status}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <a href={`mailto:${user.email}`} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'var(--primary)', textDecoration: 'none' }}>
                <Mail size={15} /> {user.email}
              </a>
              {user.phone && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'var(--text-secondary)' }}>
                  <Phone size={15} /> {user.phone}
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'var(--text-secondary)' }}>
                <Calendar size={15} /> Joined {formatDate(user.joined)}
              </div>
            </div>
          </div>

          {/* Assigned tickets */}
          <div className="card animate-in" style={{ padding: 24, animationDelay: '0.06s' }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>
              Assigned Tickets ({tickets.length})
            </h3>

            {tickets.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: 13.5, textAlign: 'center', padding: '20px 0' }}>
                No tickets assigned
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {tickets.map((t, i) => (
                  <div
                    key={t.id}
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
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 18 }}>
            User Details
          </div>

          {[
            {
              icon: Shield, label: 'Role',
              value: <span className={`badge ${isAdmin ? 'badge-admin' : 'badge-agent'}`}>{user.role}</span>
            },
            {
              icon: Database, label: 'CRM',
              value: <span className={crmBadgeClass(user.crm)}>{user.crm}</span>
            },
            {
              icon: Ticket, label: 'Total Tickets',
              value: <span style={{ fontWeight: 700, fontSize: 22 }}>{user.tickets}</span>
            },
            {
              icon: Calendar, label: 'Member Since',
              value: <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{formatDate(user.joined)}</span>
            },
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
