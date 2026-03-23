import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft, User, Building2, Database, Clock,
  Calendar, Mail, Phone, ExternalLink, AlertTriangle,
} from 'lucide-react';
import { ticketService } from '../../services/ticketService';
import {
  statusBadgeClass, priorityBadgeClass, crmBadgeClass,
  formatDateTime, getInitials, getAvatarColor,
} from '../../utils/helpers';

// ── Hover Popup ──────────────────────────────────────────────────────────────
function HoverPopup({ children, popup }) {
  const [visible, setVisible] = useState(false);
  const [pos, setPos]         = useState({ top: 0, left: 0 });
  const ref     = useRef();
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

// ── Popup contents ────────────────────────────────────────────────────────────
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
      {crm && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: 'var(--text-muted)' }}>
          <Database size={12} /> {crm}{tickets != null ? ` · ${tickets} tickets` : ''}
        </div>
      )}
    </div>
  );
}

function CrmPopup({ crm }) {
  const info = {
    EspoCRM: { desc: 'Open-source CRM platform',    color: '#7C3AED', bg: '#F3E8FF' },
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

// ── Detail Row ────────────────────────────────────────────────────────────────
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

// ── Clickable chip ────────────────────────────────────────────────────────────
function Chip({ onClick, avatarName, label, icon, linkable }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: '4px 8px', borderRadius: 'var(--radius-sm)',
        background: 'var(--surface-2)',
        cursor: linkable ? 'pointer' : 'default',
        transition: 'background 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-light)'}
      onMouseLeave={e => e.currentTarget.style.background = 'var(--surface-2)'}
    >
      {avatarName && (
        <div style={{
          width: 24, height: 24, borderRadius: '50%',
          background: getAvatarColor(avatarName),
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 10, fontWeight: 700, color: 'white', flexShrink: 0,
        }}>
          {getInitials(avatarName)}
        </div>
      )}
      {icon}
      <span style={{ fontSize: 13, color: linkable ? 'var(--primary)' : 'inherit', fontWeight: linkable ? 500 : 400 }}>
        {label}
      </span>
      {linkable && <ExternalLink size={11} color="var(--primary)" />}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function TicketDetails() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const location   = useLocation();
  const isAgent    = location.pathname.startsWith('/agent');
  const base       = isAgent ? '/agent' : '/admin';

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

const fetchTicket = () => {
  setLoading(true);
  setError(null);
  ticketService.getById(id)
    .then(data => setTicket(data))   // ← was r.data, but getById already unwraps
    .catch(err => {
      console.error('Failed to load ticket:', err);
      setError('Could not load ticket. It may not exist or the server is unavailable.');
    })
    .finally(() => setLoading(false));
};

  useEffect(() => { fetchTicket(); }, [id]);

  // ── Loading spinner ──────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        border: '3px solid var(--border)', borderTopColor: 'var(--primary)',
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  // ── Error state ──────────────────────────────────────────────────────────
  if (error) return (
    <div style={{ maxWidth: 560, margin: '40px auto' }}>
      <div style={{
        background: '#FEF2F2', border: '1px solid #FCA5A5',
        borderRadius: 'var(--radius)', padding: 24,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center',
      }}>
        <AlertTriangle size={32} color="#DC2626" />
        <div style={{ fontWeight: 600, fontSize: 15, color: '#DC2626' }}>{error}</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-outline" onClick={() => navigate(`${base}/tickets`)}>
            <ArrowLeft size={15} /> Back to tickets
          </button>
          <button className="btn btn-primary" onClick={fetchTicket}>Retry</button>
        </div>
      </div>
    </div>
  );

  // ── Ticket not returned (shouldn't happen, but guard) ────────────────────
  if (!ticket) return null;
  
  // Agent from backend is { id, name, email }
const assignee     = ticket.assignee ?? {};
const assigneeName = assignee.name || '—';

// Customer from backend is { id, first_name, last_name, email }
const customer     = ticket.customer ?? {};
const customerName = customer.name
  || `${customer.first_name ?? ''} ${customer.last_name ?? ''}`.trim()
  || '—';

// Company/account from backend is { id, company_name }
const account     = ticket.account ?? {};
const accountName = account.name || account.company_name || '—';


  return (
    <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Back / breadcrumb */}
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
          >
            Tickets
          </span>
      {' › '}{ticket.crm_id || ticket.crm_ticket_id || `#${ticket.id}`}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 290px', gap: 16, alignItems: 'start' }}>

        {/* ── Left: main content ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card animate-in" style={{ padding: 24 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
              <span className={statusBadgeClass(ticket.status)}>{ticket.status}</span>
              <span className={priorityBadgeClass(ticket.priority)}>{ticket.priority}</span>
              <span className={crmBadgeClass(ticket.crm)}>{ticket.crm}</span>
            </div>

            <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>{ticket.title}</h1>
            <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 16 }}>
              {ticket.crm_id}
              {ticket.created ? ` · Created ${formatDateTime(ticket.created)}` : ''}
            </div>

            {ticket.description ? (
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.75, fontSize: 14.5 }}>
                {ticket.description}
              </p>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: 14 }}>
                No description provided.
              </p>
            )}
          </div>
        </div>

        {/* ── Right: details sidebar ── */}
        <div className="card animate-in" style={{ padding: 20, animationDelay: '0.08s' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 18 }}>
            Details
          </div>

          {/* Raised by */}
          <DetailRow icon={User} label="Raised By">
            <HoverPopup popup={
              <PersonPopup
                name={customerName}
                email={customer.email}
                phone={customer.phone}
                extra={customer.account ? `Account: ${customer.account}` : null}
              />
            }>
              <Chip
                onClick={() => customer.id && navigate(`${base}/customers/${customer.id}`)}
                avatarName={customerName}
                label={customerName}
                linkable={!!customer.id}
              />
            </HoverPopup>
          </DetailRow>

          {/* Account */}
          <DetailRow icon={Building2} label="Account">
            <HoverPopup popup={
              <AccountPopup
                name={accountName}
                email={account.email}
                phone={account.phone}
                crm={account.crm}
                tickets={account.tickets}
              />
            }>
              <Chip
                onClick={() => account.id && navigate(`${base}/accounts/${account.id}`)}
                icon={<Building2 size={14} color="var(--primary)" />}
                label={accountName}
                linkable={!!account.id}
              />
            </HoverPopup>
          </DetailRow>

          {/* Assignee */}
          <DetailRow icon={User} label="Assignee">
            <HoverPopup popup={
              <PersonPopup
                name={assigneeName}
                email={assignee.email}
                role={assignee.role || 'Agent'}
              />
            }>
              <Chip
                onClick={() => assignee.id && navigate(`${base}/users/${assignee.id}`)}
                avatarName={assigneeName}
                label={assigneeName}
                linkable={!!assignee.id}
              />
            </HoverPopup>
          </DetailRow>

          {/* Source CRM */}
          <DetailRow icon={Database} label="Source CRM">
            <HoverPopup popup={<CrmPopup crm={ticket.crm} />}>
              <span
                className={crmBadgeClass(ticket.crm)}
                style={{ cursor: 'default' }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                {ticket.crm}
              </span>
            </HoverPopup>
          </DetailRow>

          <div style={{ height: 1, background: 'var(--border)', margin: '4px 0 16px' }} />

          {/* Timestamps */}
          <DetailRow icon={Calendar} label="Created">
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              {formatDateTime(ticket.created) || '—'}
            </span>
          </DetailRow>

          <DetailRow icon={Clock} label="Last Updated">
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              {formatDateTime(ticket.updated) || '—'}
            </span>
          </DetailRow>
        </div>
      </div>
    </div>
  );
}
