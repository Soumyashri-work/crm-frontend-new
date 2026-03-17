import { useNavigate } from 'react-router-dom';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { statusBadgeClass, priorityBadgeClass, crmBadgeClass, formatDateTime, getInitials, getAvatarColor } from '../utils/helpers';

const PRIORITY_ORDER = { Urgent: 4, High: 3, Medium: 2, Low: 1 };
const STATUS_ORDER   = { Open: 4, 'In Progress': 3, Pending: 2, Closed: 1 };

const SAMPLE = [
  { id: 11, crm_id: 'ESPO-1252', title: 'Server timeout errors',           status: 'Open',        priority: 'Urgent', assignee: 'Alex Brown',   assignee_email: 'alex.brown@company.com', customer: 'David Lee', customer_email: 'david.lee@globalindustries.com', account: 'Global Industries Inc', updated: new Date(Date.now()-3600000).toISOString(), crm: 'EspoCRM' },
  { id: 1,  crm_id: 'ESPO-1247', title: 'Login page not loading',          status: 'Open',        priority: 'Urgent', assignee: 'Sarah Chen',   assignee_email: 'sarah.chen@company.com',  customer: 'Alex Brown', customer_email: 'alex.brown@digitaldynamics.com', account: 'Digital Dynamics',      updated: new Date(Date.now()-7200000).toISOString(), crm: 'EspoCRM' },
  { id: 2,  crm_id: 'ZMD-3456',  title: 'Add dark mode support',           status: 'In Progress', priority: 'Medium', assignee: 'Mike Johnson', assignee_email: 'mike.johnson@company.com', customer: 'Sarah Kim',  customer_email: 'sarah.kim@innovationlabs.com',   account: 'Innovation Labs',        updated: new Date(Date.now()-10800000).toISOString(), crm: 'Zammad' },
  { id: 4,  crm_id: 'ZMD-3457',  title: 'Performance issue on dashboard',  status: 'In Progress', priority: 'High',   assignee: 'Sarah Chen',   assignee_email: 'sarah.chen@company.com',  customer: 'Lisa Anderson', customer_email: 'lisa.a@esg.com',               account: 'Enterprise Solutions',   updated: new Date(Date.now()-14400000).toISOString(), crm: 'Zammad' },
  { id: 5,  crm_id: 'ESPO-1248', title: 'Email notifications not sending', status: 'Open',        priority: 'High',   assignee: 'Alex Brown',   assignee_email: 'alex.brown@company.com',  customer: 'Tom Wilson',  customer_email: 'tom.w@acmecorp.com',             account: 'Acme Corporation',       updated: new Date(Date.now()-18000000).toISOString(), crm: 'EspoCRM' },
  { id: 6,  crm_id: 'ZMD-3458',  title: 'Export CSV feature request',      status: 'Closed',      priority: 'Low',    assignee: 'Mike Johnson', assignee_email: 'mike.johnson@company.com', customer: 'Rachel Green', customer_email: 'rachel.green@nexustech.io',    account: 'Nexus Technologies',     updated: new Date(Date.now()-86400000).toISOString(), crm: 'Zammad' },
];

function sortData(data, field, dir) {
  if (!field) return data;
  return [...data].sort((a, b) => {
    let av = a[field], bv = b[field];
    if (field === 'priority') { av = PRIORITY_ORDER[a.priority] || 0; bv = PRIORITY_ORDER[b.priority] || 0; }
    if (field === 'status')   { av = STATUS_ORDER[a.status] || 0;     bv = STATUS_ORDER[b.status] || 0; }
    if (field === 'updated')  { av = new Date(a.updated); bv = new Date(b.updated); }
    if (av < bv) return dir === 'asc' ? -1 : 1;
    if (av > bv) return dir === 'asc' ? 1 : -1;
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
      if (!t.title?.toLowerCase().includes(q) && !t.crm_id?.toLowerCase().includes(q)) return false;
    }
    return true;
  });
}

export default function TicketTable({ tickets, onSort, sortField, sortDir, isAgent, filters, search }) {
  const navigate = useNavigate();
  const raw = tickets || SAMPLE;

  // Client-side filter + sort when no backend
  const filtered = filters || search ? filterData(raw, filters || {}, search || '') : raw;
  const data = sortField ? sortData(filtered, sortField, sortDir) : filtered;

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ArrowUpDown size={13} style={{ opacity: 0.35, marginLeft: 4, flexShrink: 0 }} />;
    return sortDir === 'asc'
      ? <ArrowUp size={13} style={{ marginLeft: 4, color: 'var(--primary)', flexShrink: 0 }} />
      : <ArrowDown size={13} style={{ marginLeft: 4, color: 'var(--primary)', flexShrink: 0 }} />;
  };

  const thSort = (field) => ({
    style: {
      cursor: 'pointer',
      userSelect: 'none',
      color: sortField === field ? 'var(--primary)' : undefined,
      background: sortField === field ? '#EFF6FF' : undefined,
    },
    onClick: () => onSort?.(field),
  });

  if (data.length === 0) return (
    <div className="card" style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
      No tickets match your filters.
    </div>
  );

  return (
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
            {data.map((ticket, i) => (
              <tr
                key={ticket.id}
                style={{ cursor: 'pointer', animationDelay: `${i * 0.04}s` }}
                className="animate-in"
                onClick={() => navigate(isAgent ? `/agent/tickets/${ticket.id}` : `/admin/tickets/${ticket.id}`)}
              >
                <td>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                      background: 'var(--primary-light)', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
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
                <td><span className={statusBadgeClass(ticket.status)}>{ticket.status}</span></td>
                <td><span className={priorityBadgeClass(ticket.priority)}>{ticket.priority}</span></td>
                {!isAgent && (
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%',
                        background: getAvatarColor(ticket.assignee),
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, fontWeight: 700, color: 'white', flexShrink: 0,
                      }}>
                        {getInitials(ticket.assignee)}
                      </div>
                      <span style={{ fontSize: 13.5 }}>{ticket.assignee}</span>
                    </div>
                  </td>
                )}
                <td style={{ color: 'var(--text-secondary)', fontSize: 13, whiteSpace: 'nowrap' }}>
                  {formatDateTime(ticket.updated)}
                </td>
                <td><span className={crmBadgeClass(ticket.crm)}>{ticket.crm}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
