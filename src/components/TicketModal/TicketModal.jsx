import { useState, useEffect, useRef } from 'react';
import { X, Expand, User, Building2, Database, Mail, Phone, Clock, Calendar } from 'lucide-react';
import { statusBadgeClass, priorityBadgeClass, crmBadgeClass, formatDateTime, getInitials, getAvatarColor } from '../../utils/helpers';
import './TicketModal.css';

// ── Hover Popup ──────────────────────────────────────────────────────────────
function HoverPopup({ children, popup }) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef();

  const show = () => { clearTimeout(timerRef.current); setVisible(true); };
  const hide = () => { timerRef.current = setTimeout(() => setVisible(false), 120); };

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') setVisible(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <span
      onMouseEnter={show}
      onMouseLeave={hide}
      style={{ position: 'relative', display: 'inline-block', cursor: 'default' }}
    >
      {children}
      {visible && (
        <div
          onMouseEnter={() => clearTimeout(timerRef.current)}
          onMouseLeave={hide}
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            zIndex: 1100,
            width: 260,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            padding: '14px 16px',
            animation: 'fadeIn 0.15s ease',
          }}
        >
          {popup}
        </div>
      )}
    </span>
  );
}

function PersonPopup({ name, email, role, phone, extra }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
        <div style={{ width: 34, height: 34, borderRadius: '50%', background: getAvatarColor(name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'white', flexShrink: 0 }}>
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
      {extra && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{extra}</div>}
    </div>
  );
}

function AccountPopup({ name, email, phone, crm }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
        <div style={{ width: 34, height: 34, borderRadius: 8, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'var(--primary)', flexShrink: 0 }}>
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
      {crm && <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: 'var(--text-muted)' }}><Database size={12} /> {crm}</div>}
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
        <div style={{ width: 30, height: 30, borderRadius: 8, background: d.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Database size={14} color={d.color} />
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

// ── Hoverable chip ────────────────────────────────────────────────────────────
function HoverChip({ icon, label, popup }) {
  return (
    <HoverPopup popup={popup}>
      <div
        style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '5px 10px', borderRadius: 'var(--radius-sm)', background: 'var(--surface-2)', transition: 'background 0.15s', cursor: 'default' }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-light)'}
        onMouseLeave={e => e.currentTarget.style.background = 'var(--surface-2)'}
      >
        {icon}
        <span style={{ fontSize: 13, fontWeight: 500 }}>{label}</span>
      </div>
    </HoverPopup>
  );
}

// ── Main Modal ────────────────────────────────────────────────────────────────
export default function TicketModal({ ticket, isOpen, onClose, onExpand }) {
  const [isExpanding, setIsExpanding] = useState(false);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Prevent body scroll while modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen || !ticket) return null;

  const handleExpand = () => {
    setIsExpanding(true);
    setTimeout(() => {
      onExpand(ticket.id);
      onClose();
    }, 200);
  };

  // Resolve nested objects (from SAMPLE flat data or rich SAMPLES from TicketDetails)
  const assigneeName  = ticket.assignee?.name  || ticket.assignee  || '—';
  const assigneeEmail = ticket.assignee?.email || ticket.assignee_email || null;
  const assigneeRole  = ticket.assignee?.role  || 'Agent';

  const customerName  = ticket.customer?.name  || ticket.customer  || '—';
  const customerEmail = ticket.customer?.email || ticket.customer_email || null;
  const customerPhone = ticket.customer?.phone || null;
  const customerAcct  = ticket.customer?.account || ticket.account || null;

  const accountName   = ticket.account?.name  || ticket.account   || '—';
  const accountEmail  = ticket.account?.email || null;
  const accountPhone  = ticket.account?.phone || null;
  const accountCrm    = ticket.account?.crm   || ticket.crm       || null;

  return (
    <>
      {/* Backdrop */}
      <div className="ticket-modal-backdrop" onClick={onClose} aria-hidden="true" />

      {/* Modal */}
      <div className="ticket-modal-container" role="dialog" aria-modal="true" aria-label={ticket.title}>

        {/* ── Header ── */}
        <div className="ticket-modal-header">
          <div className="ticket-modal-title-section">
            <div style={{ width: 34, height: 34, borderRadius: 8, flexShrink: 0, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'var(--primary)' }}>
              #{ticket.id}
            </div>
            <div style={{ minWidth: 0 }}>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {ticket.title}
              </h2>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                {ticket.crm_id}
              </p>
            </div>
          </div>

          <div className="ticket-modal-actions">
            <button
              className="modal-action-btn expand-btn"
              onClick={handleExpand}
              title="Expand to full page"
              disabled={isExpanding}
              aria-label="Expand ticket to full page"
            >
              <Expand size={17} />
            </button>
            <button
              className="modal-action-btn close-btn"
              onClick={onClose}
              title="Close"
              aria-label="Close modal"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="ticket-modal-body">

          {/* Badges row */}
          <div className="modal-section">
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <div>
                <label className="modal-label">Status</label>
                <span className={statusBadgeClass(ticket.status)}>{ticket.status}</span>
              </div>
              <div>
                <label className="modal-label">Priority</label>
                <span className={priorityBadgeClass(ticket.priority)}>{ticket.priority}</span>
              </div>
              <div>
                <label className="modal-label">CRM Source</label>
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
              </div>
            </div>
          </div>

          {/* Details — hoverable chips */}
          <div className="modal-section">
            <h3 className="modal-section-title">Details</h3>
            <div className="modal-details-grid">

              <div className="detail-item">
                <label className="modal-label">Raised By</label>
                <HoverChip
                  icon={
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: getAvatarColor(customerName), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                      {getInitials(customerName)}
                    </div>
                  }
                  label={customerName}
                  popup={<PersonPopup name={customerName} email={customerEmail} phone={customerPhone} extra={customerAcct ? `Account: ${customerAcct}` : null} />}
                />
              </div>

              <div className="detail-item">
                <label className="modal-label">Account</label>
                <HoverChip
                  icon={<Building2 size={14} color="var(--primary)" />}
                  label={accountName}
                  popup={<AccountPopup name={accountName} email={accountEmail} phone={accountPhone} crm={accountCrm} />}
                />
              </div>

              <div className="detail-item">
                <label className="modal-label">Assignee</label>
                <HoverChip
                  icon={
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: getAvatarColor(assigneeName), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                      {getInitials(assigneeName)}
                    </div>
                  }
                  label={assigneeName}
                  popup={<PersonPopup name={assigneeName} email={assigneeEmail} role={assigneeRole} />}
                />
              </div>

              <div className="detail-item">
                <label className="modal-label">Source CRM</label>
                <HoverChip
                  icon={<Database size={14} color="var(--primary)" />}
                  label={ticket.crm}
                  popup={<CrmPopup crm={ticket.crm} />}
                />
              </div>

            </div>
          </div>

          {/* Description */}
          {ticket.description && (
            <div className="modal-section">
              <h3 className="modal-section-title">Description</h3>
              <div className="modal-description">
                <p style={{ margin: 0, lineHeight: 1.7, color: 'var(--text-secondary)', fontSize: 13.5 }}>
                  {ticket.description}
                </p>
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="modal-section">
            <h3 className="modal-section-title">Timeline</h3>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              <div>
                <label className="modal-label" style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                  <Calendar size={11} /> Created
                </label>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  {formatDateTime(ticket.created || ticket.updated)}
                </span>
              </div>
              <div>
                <label className="modal-label" style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                  <Clock size={11} /> Last Updated
                </label>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  {formatDateTime(ticket.updated)}
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* ── Footer ── */}
        <div className="ticket-modal-footer">
          <button className="modal-btn modal-btn-secondary" onClick={onClose}>
            Close
          </button>
          <button className="modal-btn modal-btn-primary" onClick={handleExpand} disabled={isExpanding}>
            {isExpanding ? 'Opening…' : 'View Full Details'}
          </button>
        </div>

      </div>
    </>
  );
}
