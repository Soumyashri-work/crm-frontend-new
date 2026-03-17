import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, User, Building2, Database, Clock, Calendar, Mail, Phone, ExternalLink } from 'lucide-react';
import { ticketService } from '../../services/ticketService';
import { statusBadgeClass, priorityBadgeClass, crmBadgeClass, formatDateTime, getInitials, getAvatarColor } from '../../utils/helpers';

const SAMPLES = {
  11: { id: 11, crm_id: 'ESPO-1252', title: 'Server timeout errors', status: 'Open', priority: 'Urgent', crm: 'EspoCRM', updated: new Date(Date.now()-3600000).toISOString(), created: new Date(Date.now()-86400000).toISOString(), description: 'Users are experiencing server timeout errors when trying to load the dashboard. This started happening after the latest deployment. Needs immediate investigation.', assignee: { id: 1, name: 'Alex Brown', email: 'alex.brown@company.com', role: 'Agent' }, customer: { id: 1, name: 'David Lee', email: 'david.lee@globalindustries.com', phone: '+1 (555) 333-4444', account: 'Global Industries Inc' }, account: { id: 1, name: 'Global Industries Inc', email: 'support@globalindustries.com', phone: '+1 (555) 345-6789', crm: 'EspoCRM', tickets: 45 }, comments: [{ id: 1, author: 'Sarah Chen', text: 'I can reproduce this on production.', created: new Date(Date.now()-7200000).toISOString() }] },
  1:  { id: 1,  crm_id: 'ESPO-1247', title: 'Login page not loading', status: 'Open', priority: 'Urgent', crm: 'EspoCRM', updated: new Date(Date.now()-7200000).toISOString(), created: new Date(Date.now()-172800000).toISOString(), description: 'The login page is not loading for several users in the US region. The page shows a blank white screen with no error messages.', assignee: { id: 7, name: 'Sarah Chen', email: 'sarah.chen@company.com', role: 'Agent' }, customer: { id: 2, name: 'Alex Brown', email: 'alex.brown@digitaldynamics.com', phone: '+1 (555) 444-5555', account: 'Digital Dynamics' }, account: { id: 2, name: 'Digital Dynamics', email: 'info@digitaldynamics.com', phone: '+1 (555) 456-7890', crm: 'Zammad', tickets: 12 }, comments: [] },
  2:  { id: 2,  crm_id: 'ZMD-3456',  title: 'Add dark mode support', status: 'In Progress', priority: 'Medium', crm: 'Zammad', updated: new Date(Date.now()-10800000).toISOString(), created: new Date(Date.now()-259200000).toISOString(), description: 'Feature request to add dark mode support to the application. This is highly requested by users who work in low-light environments.', assignee: { id: 8, name: 'Mike Johnson', email: 'mike.johnson@company.com', role: 'Agent' }, customer: { id: 3, name: 'Sarah Kim', email: 'sarah.kim@innovationlabs.com', phone: '+1 (555) 555-6666', account: 'Innovation Labs' }, account: { id: 3, name: 'Innovation Labs', email: 'contact@innovationlabs.com', phone: '+1 (555) 567-8901', crm: 'EspoCRM', tickets: 31 }, comments: [] },
  4:  { id: 4,  crm_id: 'ZMD-3457',  title: 'Performance issue on dashboard', status: 'In Progress', priority: 'High', crm: 'Zammad', updated: new Date(Date.now()-14400000).toISOString(), created: new Date(Date.now()-345600000).toISOString(), description: 'Users are reporting slow load times on the main dashboard page.', assignee: { id: 7, name: 'Sarah Chen', email: 'sarah.chen@company.com', role: 'Agent' }, customer: { id: 5, name: 'Lisa Anderson', email: 'lisa.a@esg.com', phone: '+1 (555) 777-8888', account: 'Enterprise Solutions Group' }, account: { id: 5, name: 'Enterprise Solutions Group', email: 'contact@esg.com', phone: '+1 (555) 789-0123', crm: 'EspoCRM', tickets: 56 }, comments: [] },
  5:  { id: 5,  crm_id: 'ESPO-1248', title: 'Email notifications not sending', status: 'Open', priority: 'High', crm: 'EspoCRM', updated: new Date(Date.now()-18000000).toISOString(), created: new Date(Date.now()-432000000).toISOString(), description: 'The system is not sending email notifications when tickets are created or updated.', assignee: { id: 1, name: 'Alex Brown', email: 'alex.brown@company.com', role: 'Agent' }, customer: { id: 6, name: 'Tom Wilson', email: 'tom.w@acmecorp.com', phone: '+1 (555) 888-9999', account: 'Acme Corporation' }, account: { id: 7, name: 'Acme Corporation', email: 'hello@acme.com', phone: '+1 (555) 901-2345', crm: 'EspoCRM', tickets: 19 }, comments: [] },
  6:  { id: 6,  crm_id: 'ZMD-3458',  title: 'Export CSV feature request', status: 'Closed', priority: 'Low', crm: 'Zammad', updated: new Date(Date.now()-86400000).toISOString(), created: new Date(Date.now()-604800000).toISOString(), description: 'Users want the ability to export ticket data to CSV format for reporting purposes.', assignee: { id: 8, name: 'Mike Johnson', email: 'mike.johnson@company.com', role: 'Agent' }, customer: { id: 7, name: 'Rachel Green', email: 'rachel.green@nexustech.io', phone: '+1 (555) 999-0000', account: 'Nexus Technologies' }, account: { id: 6, name: 'Nexus Technologies', email: 'info@nexustech.io', phone: '+1 (555) 890-1234', crm: 'Zammad', tickets: 22 }, comments: [] },
};
const DEFAULT_SAMPLE = SAMPLES[11];

// ── Hover Popup ──────────────────────────────────────────────────────────────
function HoverPopup({ children, popup }) {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const ref = useRef();
  const timerRef = useRef();

  const show = () => {
    clearTimeout(timerRef.current);
    const rect = ref.current?.getBoundingClientRect();
    if (rect) setPos({ top: rect.bottom + 8, left: rect.left });
    setVisible(true);
  };
  const hide = () => { timerRef.current = setTimeout(() => setVisible(false), 120); };

  return (
    <>
      <span ref={ref} onMouseEnter={show} onMouseLeave={hide} style={{ cursor: 'default' }}>
        {children}
      </span>
      {visible && (
        <div
          onMouseEnter={() => clearTimeout(timerRef.current)}
          onMouseLeave={hide}
          style={{
            position: 'fixed', top: pos.top, left: pos.left,
            zIndex: 9999, minWidth: 220, maxWidth: 280,
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-lg)',
            padding: '14px 16px', animation: 'fadeIn 0.15s ease',
          }}
        >
          {popup}
        </div>
      )}
    </>
  );
}

// ── Popup contents ───────────────────────────────────────────────────────────
function PersonPopup({ name, email, role, phone, extra }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: getAvatarColor(name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'white', flexShrink: 0 }}>
          {getInitials(name)}
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 13.5 }}>{name}</div>
          {role && <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{role}</div>}
        </div>
      </div>
      {email && (
        <a href={`mailto:${email}`} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: 'var(--primary)', marginBottom: 6, textDecoration: 'none' }}>
          <Mail size={13} /> {email}
        </a>
      )}
      {phone && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: 'var(--text-secondary)', marginBottom: 6 }}>
          <Phone size={13} /> {phone}
        </div>
      )}
      {extra && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{extra}</div>}
    </div>
  );
}

function AccountPopup({ name, email, phone, crm, tickets }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'var(--primary)', flexShrink: 0 }}>
          {getInitials(name)}
        </div>
        <div style={{ fontWeight: 600, fontSize: 13.5 }}>{name}</div>
      </div>
      {email && (
        <a href={`mailto:${email}`} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: 'var(--primary)', marginBottom: 6, textDecoration: 'none' }}>
          <Mail size={13} /> {email}
        </a>
      )}
      {phone && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: 'var(--text-secondary)', marginBottom: 6 }}>
          <Phone size={13} /> {phone}
        </div>
      )}
      {crm && <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: 'var(--text-muted)' }}><Database size={12} /> {crm} · {tickets} tickets</div>}
    </div>
  );
}

function CrmPopup({ crm }) {
  const info = {
    EspoCRM: { desc: 'Open-source CRM platform', color: '#7C3AED', bg: '#F3E8FF' },
    Zammad:  { desc: 'Help desk & ticketing system', color: '#059669', bg: '#ECFDF5' },
  };
  const d = info[crm] || { desc: 'CRM source', color: 'var(--primary)', bg: 'var(--primary-light)' };
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: d.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Database size={15} color={d.color} />
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 13.5 }}>{crm}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{d.desc}</div>
        </div>
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Ticket synced from {crm}</div>
    </div>
  );
}

// ── Detail Row ───────────────────────────────────────────────────────────────
function DetailRow({ icon: Icon, label, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: 5 }}>
        <Icon size={11} /> {label}
      </div>
      <div style={{ fontSize: 13.5, fontWeight: 500 }}>{children}</div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function TicketDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isAgent = location.pathname.startsWith('/agent');
  const base = isAgent ? '/agent' : '/admin';
  const [ticket, setTicket] = useState(null);
  // const [comment, setComment] = useState('');
  // const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    ticketService.getById(id)
      .then(r => setTicket(r.data))
      .catch(() => setTicket(SAMPLES[Number(id)] || DEFAULT_SAMPLE));
  }, [id]);

  // const handleComment = async () => { ... };

  if (!ticket) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: 'var(--primary)', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const assignee = ticket.assignee || {};
  const customer = ticket.customer || {};
  const account  = ticket.account  || {};

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Back */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={() => navigate(`${base}/tickets`)} className="btn btn-ghost" style={{ padding: '6px 10px' }}>
          <ArrowLeft size={16} /> Back
        </button>
        <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
          <span
            onClick={() => navigate(`${base}/tickets`)}
            style={{ cursor: 'pointer', color: 'var(--text-muted)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--primary)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
          >Tickets</span>
          {' › '}#{ticket.id}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 290px', gap: 16, alignItems: 'start' }}>

        {/* ── Left: ticket card (comments removed) ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card animate-in" style={{ padding: 24 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
              <span className={statusBadgeClass(ticket.status)}>{ticket.status}</span>
              <span className={priorityBadgeClass(ticket.priority)}>{ticket.priority}</span>
              <span className={crmBadgeClass(ticket.crm)}>{ticket.crm}</span>
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>{ticket.title}</h1>
            <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 16 }}>
              {ticket.crm_id} · Created {formatDateTime(ticket.created)}
            </div>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.75, fontSize: 14.5 }}>
              {ticket.description}
            </p>
          </div>

          {/* Comments section — disabled
          <div className="card animate-in" style={{ padding: 24, animationDelay: '0.05s' }}>
            ...comments UI...
          </div>
          */}
        </div>

        {/* ── Right: Details sidebar ── */}
        <div className="card animate-in" style={{ padding: 20, animationDelay: '0.08s' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 18 }}>
            Details
          </div>

          {/* Raised by (Customer) */}
          <DetailRow icon={User} label="Raised By">
            <HoverPopup popup={
              <PersonPopup
                name={customer.name || 'Unknown'}
                email={customer.email}
                phone={customer.phone}
                extra={customer.account ? `Account: ${customer.account}` : null}
              />
            }>
              <div
                onClick={() => customer.id && navigate(`${base}/customers/${customer.id}`)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 8px', borderRadius: 'var(--radius-sm)', background: 'var(--surface-2)', cursor: customer.id ? 'pointer' : 'default', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-light)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--surface-2)'}
              >
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: getAvatarColor(customer.name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                  {getInitials(customer.name || '?')}
                </div>
                <span style={{ fontSize: 13, color: customer.id ? 'var(--primary)' : 'inherit', fontWeight: customer.id ? 500 : 400 }}>{customer.name || '—'}</span>
                {customer.id && <ExternalLink size={11} color="var(--primary)" />}
              </div>
            </HoverPopup>
          </DetailRow>

          {/* Account */}
          <DetailRow icon={Building2} label="Account">
            <HoverPopup popup={
              <AccountPopup
                name={account.name || customer.account || 'Unknown'}
                email={account.email}
                phone={account.phone}
                crm={account.crm}
                tickets={account.tickets}
              />
            }>
              <div
                onClick={() => account.id && navigate(`${base}/accounts/${account.id}`)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 8px', borderRadius: 'var(--radius-sm)', background: 'var(--surface-2)', cursor: account.id ? 'pointer' : 'default', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-light)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--surface-2)'}
              >
                <Building2 size={14} color="var(--primary)" />
                <span style={{ fontSize: 13, color: account.id ? 'var(--primary)' : 'inherit', fontWeight: account.id ? 500 : 400 }}>{account.name || customer.account || '—'}</span>
                {account.id && <ExternalLink size={11} color="var(--primary)" />}
              </div>
            </HoverPopup>
          </DetailRow>

          {/* Assignee */}
          <DetailRow icon={User} label="Assignee">
            <HoverPopup popup={
              <PersonPopup
                name={assignee.name || ticket.assignee}
                email={assignee.email}
                role={assignee.role || 'Agent'}
              />
            }>
              <div
                onClick={() => assignee.id && navigate(`${base}/users/${assignee.id}`)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 8px', borderRadius: 'var(--radius-sm)', background: 'var(--surface-2)', cursor: assignee.id ? 'pointer' : 'default', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-light)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--surface-2)'}
              >
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: getAvatarColor(assignee.name || ticket.assignee), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                  {getInitials(assignee.name || ticket.assignee || '?')}
                </div>
                <span style={{ fontSize: 13, color: assignee.id ? 'var(--primary)' : 'inherit', fontWeight: assignee.id ? 500 : 400 }}>{assignee.name || ticket.assignee || '—'}</span>
                {assignee.id && <ExternalLink size={11} color="var(--primary)" />}
              </div>
            </HoverPopup>
          </DetailRow>

          {/* Source CRM */}
          <DetailRow icon={Database} label="Source CRM">
            <HoverPopup popup={<CrmPopup crm={ticket.crm} />}>
              <div style={{ display: 'inline-flex', cursor: 'default' }}>
                <span
                  className={crmBadgeClass(ticket.crm)}
                  style={{ cursor: 'default' }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >
                  {ticket.crm}
                </span>
              </div>
            </HoverPopup>
          </DetailRow>

          <div style={{ height: 1, background: 'var(--border)', margin: '4px 0 16px' }} />

          {/* Timestamps */}
          <DetailRow icon={Calendar} label="Created">
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{formatDateTime(ticket.created)}</span>
          </DetailRow>

          <DetailRow icon={Clock} label="Last Updated">
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{formatDateTime(ticket.updated)}</span>
          </DetailRow>
        </div>

      </div>
    </div>
  );
}
