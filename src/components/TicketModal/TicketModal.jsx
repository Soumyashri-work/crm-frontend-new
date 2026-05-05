/**
 * TicketModal.jsx — Refactored with unified Modal component
 * 
 * Read-only ticket detail modal with:
 * - Hover-over popups for person/CRM details
 * - Status and priority badges
 * - Ticket description and timeline
 * - Expand to full page and edit actions
 * - Responsive design
 * 
 * Props:
 *   ticket {object}   - Ticket data
 *   isOpen {boolean}  - Controls modal visibility
 *   onClose {function} - Called when user closes modal
 *   onExpand {function} - Called when user clicks expand (receives ticket.id)
 *   onEdit {function}  - Called when user clicks edit (only for admins)
 *   isAdmin {boolean}  - Whether current user is admin (default: false)
 */

import { useState, useEffect, useRef } from 'react';
import { Expand, Database, Mail, Phone, Clock, Calendar } from 'lucide-react';
import { Modal } from '../Modal';
import {
  statusBadgeClass,
  priorityBadgeClass,
  crmBadgeClass,
  formatDateTime,
  getInitials,
  getAvatarColor,
} from '../../utils/helpers';

// ── Hover Popup Component ────────────────────────────────────────────────────
function HoverPopup({ children, popup }) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef();

  const show = () => {
    clearTimeout(timerRef.current);
    setVisible(true);
  };
  const hide = () => {
    timerRef.current = setTimeout(() => setVisible(false), 120);
  };

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') setVisible(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <span
      onMouseEnter={show}
      onMouseLeave={hide}
      style={{
        position: 'relative',
        display: 'inline-block',
        cursor: 'default',
      }}
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
            zIndex: 1102,
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

// ── Person Popup ─────────────────────────────────────────────────────────────
function PersonPopup({ name, email, role, phone, extra }) {
  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 10,
          paddingBottom: 10,
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: '50%',
            background: getAvatarColor(name),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            fontWeight: 700,
            color: 'white',
            flexShrink: 0,
          }}
        >
          {getInitials(name)}
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 13.5 }}>{name}</div>
          {role && (
            <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
              {role}
            </div>
          )}
        </div>
      </div>
      {email && (
        <a
          href={`mailto:${email}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            fontSize: 12.5,
            color: 'var(--primary)',
            marginBottom: 6,
            textDecoration: 'none',
          }}
        >
          <Mail size={13} /> {email}
        </a>
      )}
      {phone && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            fontSize: 12.5,
            color: 'var(--text-secondary)',
            marginBottom: 6,
          }}
        >
          <Phone size={13} /> {phone}
        </div>
      )}
      {extra && (
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
          {extra}
        </div>
      )}
    </div>
  );
}

// ── CRM Popup ────────────────────────────────────────────────────────────────
function CrmPopup({ crm }) {
  const info = {
    EspoCRM: {
      desc: 'Open-source CRM platform',
      color: '#7C3AED',
      bg: '#F3E8FF',
    },
    Zammad: {
      desc: 'Help desk & ticketing system',
      color: '#059669',
      bg: '#ECFDF5',
    },
  };
  const d = info[crm] || {
    desc: 'CRM source',
    color: 'var(--primary)',
    bg: 'var(--primary-light)',
  };
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            background: d.bg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Database size={14} color={d.color} />
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 13.5 }}>{crm}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {d.desc}
          </div>
        </div>
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
        Ticket synced from {crm}
      </div>
    </div>
  );
}

// ── Hoverable Chip ───────────────────────────────────────────────────────────
function HoverChip({ icon, label, popup }) {
  return (
    <HoverPopup popup={popup}>
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 7,
          padding: '5px 10px',
          borderRadius: 'var(--radius-sm)',
          background: 'var(--surface-2)',
          transition: 'background 0.15s',
          cursor: 'default',
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.background = 'var(--primary-light)')
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.background = 'var(--surface-2)')
        }
      >
        {icon}
        <span style={{ fontSize: 13, fontWeight: 500 }}>{label}</span>
      </div>
    </HoverPopup>
  );
}

// ── Main Modal ───────────────────────────────────────────────────────────────
export default function TicketModal({
  ticket,
  isOpen,
  onClose,
  onExpand,
  onEdit,
  isAdmin = false,
}) {
  const [isExpanding, setIsExpanding] = useState(false);

  if (!isOpen || !ticket) return null;

  // ─── Derived data ────────────────────────────────────────────────────
  const assigneeName = ticket.assignee?.name || '—';
  const assigneeEmail = ticket.assignee?.email || null;
  const assigneeRole = ticket.assignee?.role || 'Agent';

  const customerName =
    ticket.customer?.name ||
    `${ticket.customer?.first_name ?? ''} ${ticket.customer?.last_name ?? ''}`.trim() ||
    '—';
  const customerEmail = ticket.customer?.email || null;
  const customerPhone = ticket.customer?.phone || null;

  // ─── Handlers ────────────────────────────────────────────────────────
  const handleExpand = () => {
    setIsExpanding(true);
    setTimeout(() => {
      onExpand(ticket.id);
      onClose();
    }, 200);
  };

  // ─── Render modal header with custom title and actions ───────────────
  const customHeader = (
    <div className="modal-header" style={{ justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: '50%',
            flexShrink: 0,
            background: getAvatarColor(
              ticket.title || ticket.crm || String(ticket.id || '')
            ),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            fontWeight: 700,
            color: 'white',
          }}
        >
          {getInitials(ticket.title)}
        </div>
        <div style={{ minWidth: 0 }}>
          <h2
            id="ticket-modal-title"
            style={{
              margin: 0,
              fontSize: 17,
              lineHeight: 1.2,
              fontWeight: 600,
              color: 'var(--text-primary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {ticket.title}
          </h2>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        {isAdmin && onEdit && (
          <button
            onClick={onEdit}
            className="modal-btn modal-btn-secondary"
            title="Edit ticket"
            aria-label="Edit ticket"
            style={{ fontSize: 12, padding: '6px 12px' }}
          >
            ✏️ Edit
          </button>
        )}
        <button
          onClick={handleExpand}
          className="modal-btn modal-btn-secondary"
          title="Expand to full page"
          disabled={isExpanding}
          aria-label="Expand ticket to full page"
          style={{ padding: 6 }}
        >
          <Expand size={17} />
        </button>
      </div>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="700px"
      titleId="ticket-modal-title"
    >
      {/* Custom header passed via children slot */}
      {customHeader}

      {/* Body content */}
      <div className="modal-body" style={{ gap: 16 }}>
        {/* Badges row */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
              Status
            </label>
            <span className={statusBadgeClass(ticket.status)}>
              {ticket.status}
            </span>
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
              Priority
            </label>
            <span className={priorityBadgeClass(ticket.priority)}>
              {ticket.priority}
            </span>
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
              CRM Source
            </label>
            <HoverPopup popup={<CrmPopup crm={ticket.crm} />}>
              <span
                className={crmBadgeClass(ticket.crm)}
                style={{ cursor: 'default' }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
              >
                {ticket.crm}
              </span>
            </HoverPopup>
          </div>
        </div>

        {/* Details — hoverable chips */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h3
            style={{
              margin: 0,
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Details
          </h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.3px',
                  marginBottom: 6,
                }}
              >
                Raised By
              </label>
              <HoverChip
                icon={
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      background: getAvatarColor(customerName),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 9,
                      fontWeight: 700,
                      color: 'white',
                      flexShrink: 0,
                    }}
                  >
                    {getInitials(customerName)}
                  </div>
                }
                label={customerName}
                popup={
                  <PersonPopup
                    name={customerName}
                    email={customerEmail}
                    phone={customerPhone}
                  />
                }
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.3px',
                  marginBottom: 6,
                }}
              >
                Assignee
              </label>
              <HoverChip
                icon={
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      background: getAvatarColor(assigneeName),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 9,
                      fontWeight: 700,
                      color: 'white',
                      flexShrink: 0,
                    }}
                  >
                    {getInitials(assigneeName)}
                  </div>
                }
                label={assigneeName}
                popup={
                  <PersonPopup
                    name={assigneeName}
                    email={assigneeEmail}
                    role={assigneeRole}
                  />
                }
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.3px',
                  marginBottom: 6,
                }}
              >
                Source CRM
              </label>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <h3
              style={{
                margin: 0,
                fontSize: 13,
                fontWeight: 700,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Description
            </h3>
            <div
              style={{
                backgroundColor: 'var(--surface-2)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: '12px 16px',
                fontSize: 13,
              }}
            >
              <p
                style={{
                  margin: 0,
                  lineHeight: 1.7,
                  color: 'var(--text-secondary)',
                  fontSize: 13.5,
                }}
              >
                {ticket.description}
              </p>
            </div>
          </div>
        )}

        {/* Timestamps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h3
            style={{
              margin: 0,
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Timeline
          </h3>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  marginBottom: 4,
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.3px',
                }}
              >
                <Calendar size={11} /> Created
              </label>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                {formatDateTime(ticket.created || ticket.updated)}
              </span>
            </div>
            <div>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  marginBottom: 4,
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.3px',
                }}
              >
                <Clock size={11} /> Last Updated
              </label>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                {formatDateTime(ticket.updated)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="modal-footer">
        <button
          onClick={onClose}
          className="modal-btn modal-btn-secondary"
        >
          Close
        </button>
        <button
          onClick={handleExpand}
          disabled={isExpanding}
          className="modal-btn modal-btn-primary"
        >
          {isExpanding ? 'Opening…' : 'View Full Details'}
        </button>
      </div>
    </Modal>
  );
}