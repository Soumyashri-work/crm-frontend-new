import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import {
  statusBadgeClass, priorityBadgeClass, crmBadgeClass,
  formatDateTime, getInitials, getAvatarColor,
} from '../utils/helpers';
import TicketModal from './TicketModal/TicketModal';

const PRIORITY_ORDER = { Urgent: 4, High: 3, Medium: 2, Low: 1 };
const STATUS_ORDER   = { Open: 4, 'In Progress': 3, Pending: 2, Closed: 1 };

function sortData(data, field, dir) {
  if (!field) return data;
  return [...data].sort((a, b) => {
    let av = a[field], bv = b[field];
    if (field === 'priority') { av = PRIORITY_ORDER[a.priority] || 0; bv = PRIORITY_ORDER[b.priority] || 0; }
    if (field === 'status')   { av = STATUS_ORDER[a.status]   || 0; bv = STATUS_ORDER[b.status]   || 0; }
    if (field === 'updated')  { av = new Date(a.updated); bv = new Date(b.updated); }
    if (av < bv) return dir === 'asc' ? -1 : 1;
    if (av > bv) return dir === 'asc' ? 1  : -1;
    return 0;
  });
}

function filterData(data, filters, search) {
  return data.filter(t => {
    if (filters.status   && t.status   !== filters.status)   return false;
    if (filters.priority && t.priority !== filters.priority) return false;
    if (filters.crm      && t.crm      !== filters.crm)      return false;
    if (search) {
      const q = search.toLowerCase();
      const title  = (t.title  || '').toLowerCase();
      const crmId  = (t.crm_id || '').toLowerCase();
      if (!title.includes(q) && !crmId.includes(q)) return false;
    }
    return true;
  });
}

// Resolve nested assignee name whether it's a string or object
function assigneeName(t) {
  if (!t.assignee) return '—';
  if (typeof t.assignee === 'string') return t.assignee;
  return t.assignee.name || '—';
}

export default function TicketTable({
  tickets,
  onSort, sortField, sortDir,
  isAgent,
  filters, search,
  loading,
}) {
  const navigate = useNavigate();
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isModalOpen, setIsModalOpen]       = useState(false);

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="card" style={{ overflow: 'hidden' }}>
        {[...Array(5)].map((_, i) => (
          <div key={i} style={{
            display: 'flex', gap: 16, padding: '14px 16px',
            borderBottom: '1px solid var(--border-light)',
            alignItems: 'center',
          }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--border)', animation: 'pulse 1.4s ease-in-out infinite', flexShrink: 0 }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ height: 13, width: '55%', borderRadius: 4, background: 'var(--border)', animation: 'pulse 1.4s ease-in-out infinite' }} />
              <div style={{ height: 11, width: '30%', borderRadius: 4, background: 'var(--border)', animation: 'pulse 1.4s ease-in-out infinite', animationDelay: '0.1s' }} />
            </div>
            <div style={{ width: 68, height: 22, borderRadius: 99, background: 'var(--border)', animation: 'pulse 1.4s ease-in-out infinite' }} />
            <div style={{ width: 60, height: 22, borderRadius: 99, background: 'var(--border)', animation: 'pulse 1.4s ease-in-out infinite' }} />
          </div>
        ))}
        <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.45} }`}</style>
      </div>
    );
  }

  // ── Derive display data ───────────────────────────────────────────────────
  const raw      = tickets || [];
  const filtered = (filters || search) ? filterData(raw, filters || {}, search || '') : raw;
  const data     = sortField ? sortData(filtered, sortField, sortDir) : filtered;

  const SortIcon = ({ field }) => {
    if (sortField !== field)
      return <ArrowUpDown size={13} style={{ opacity: 0.35, marginLeft: 4, flexShrink: 0 }} />;
    return sortDir === 'asc'
      ? <ArrowUp   size={13} style={{ marginLeft: 4, color: 'var(--primary)', flexShrink: 0 }} />
      : <ArrowDown size={13} style={{ marginLeft: 4, color: 'var(--primary)', flexShrink: 0 }} />;
  };

  const thSort = (field) => ({
    style: {
      cursor: 'pointer', userSelect: 'none',
      color:      sortField === field ? 'var(--primary)' : undefined,
      background: sortField === field ? '#EFF6FF'        : undefined,
    },
    onClick: () => onSort?.(field),
  });

  const handleRowClick = (ticket) => {
    setSelectedTicket(ticket);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedTicket(null), 300);
  };

  const handleExpandTicket = (ticketId) => {
    navigate(isAgent ? `/agent/tickets/${ticketId}` : `/admin/tickets/${ticketId}`);
  };

  // ── Empty state ───────────────────────────────────────────────────────────
  if (data.length === 0) {
    return (
      <div className="card" style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
        {raw.length === 0
          ? 'No tickets found.'
          : 'No tickets match your filters.'}
      </div>
    );
  }

  // ── Table ─────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>TICKET</th>
                <th {...thSort('status')}>
                  <span style={{ display: 'flex', alignItems: 'center' }}>STATUS <SortIcon field="status" /></span>
                </th>
                <th {...thSort('priority')}>
                  <span style={{ display: 'flex', alignItems: 'center' }}>PRIORITY <SortIcon field="priority" /></span>
                </th>
                {!isAgent && <th>ASSIGNEE</th>}
                <th {...thSort('updated')}>
                  <span style={{ display: 'flex', alignItems: 'center' }}>UPDATED <SortIcon field="updated" /></span>
                </th>
                <th>CRM</th>
              </tr>
            </thead>
            <tbody>
              {data.map((ticket, i) => {
                const name = assigneeName(ticket);
                return (
                  <tr
                    key={ticket.id}
                    style={{ cursor: 'pointer', animationDelay: `${i * 0.04}s` }}
                    className="animate-in"
                    onClick={() => handleRowClick(ticket)}
                  >
                    <td>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                          background: 'var(--primary-light)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 11, fontWeight: 700, color: 'var(--primary)',
                        }}>
                          #{ticket.id}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{ticket.title}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{ticket.crm_id}</div>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className={statusBadgeClass(ticket.status)}>{ticket.status}</span>
                    </td>

                    <td>
                      <span className={priorityBadgeClass(ticket.priority)}>{ticket.priority}</span>
                    </td>

                    {!isAgent && (
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{
                            width: 28, height: 28, borderRadius: '50%',
                            background: getAvatarColor(name),
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 11, fontWeight: 700, color: 'white', flexShrink: 0,
                          }}>
                            {getInitials(name)}
                          </div>
                          <span style={{ fontSize: 13.5 }}>{name}</span>
                        </div>
                      </td>
                    )}

                    <td style={{ color: 'var(--text-secondary)', fontSize: 13, whiteSpace: 'nowrap' }}>
                      {formatDateTime(ticket.updated)}
                    </td>

                    <td>
                      <span className={crmBadgeClass(ticket.crm)}>{ticket.crm}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <TicketModal
        ticket={selectedTicket}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onExpand={handleExpandTicket}
      />
    </>
  );
}
