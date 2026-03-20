export function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

export function formatDate(date) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });
}

export function formatDateTime(date) {
  if (!date) return '—';
  return new Date(date).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}

export function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export function getAvatarColor(name) {
  const colors = ['#2563EB','#7C3AED','#059669','#D97706','#DC2626','#0891B2','#65A30D'];
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) hash += name.charCodeAt(i);
  return colors[hash % colors.length];
}

export function statusBadgeClass(status) {
  const map = {
    open: 'badge-open',
    closed: 'badge-closed',
    pending: 'badge-pending',
    'in progress': 'badge-inprogress',
    inprogress: 'badge-inprogress',
  };
  return 'badge ' + (map[status?.toLowerCase()] || 'badge-open');
}

export function priorityBadgeClass(priority) {
  const map = {
    urgent: 'badge-urgent',
    high: 'badge-high',
    medium: 'badge-medium',
    low: 'badge-low',
  };
  return 'badge ' + (map[priority?.toLowerCase()] || 'badge-medium');
}

export function crmBadgeClass(crm) {
  if (!crm) return 'badge';
  return 'badge ' + (crm.toLowerCase().includes('espo') ? 'badge-espocrm' : 'badge-zammad');
}

export function truncate(str, n = 40) {
  if (!str) return '';
  return str.length > n ? str.slice(0, n) + '…' : str;
}

// ── Ticket field normalizer ──────────────────────────────────────────────────
// Maps the backend DB schema to the shape the frontend components expect.
// Backend fields:  crm_ticket_id, source_system_id, status_id, priority_id,
//                  company_id, customer_id, agent_id, created_at, updated_at
//                  (joined relations may arrive as status{name}, priority{name},
//                   source_system{name}, company{name,…}, customer{name,…},
//                   agent{name,…})
export function normalizeTicket(raw) {
  if (!raw) return null;

  // ── status ──
  const status =
    raw.status?.name ||
    raw.status_name ||
    (typeof raw.status === 'string' ? raw.status : null) ||
    raw.status_id?.toString() ||
    'Open';

  // ── priority ──
  const priority =
    raw.priority?.name ||
    raw.priority_name ||
    (typeof raw.priority === 'string' ? raw.priority : null) ||
    raw.priority_id?.toString() ||
    'Medium';

  // ── CRM / source system ──
  const crm =
    raw.source_system?.name ||
    raw.source_system_name ||
    (typeof raw.crm === 'string' ? raw.crm : null) ||
    'EspoCRM';

  // ── assignee (agent) ──
  const agentRaw = raw.agent || raw.assignee || {};
  const assignee =
    typeof agentRaw === 'string'
      ? agentRaw
      : {
          id:    agentRaw.id    || raw.agent_id    || null,
          name:  agentRaw.name  || agentRaw.full_name || '—',
          email: agentRaw.email || null,
          role:  agentRaw.role  || 'Agent',
        };

  // ── customer ──
  const custRaw = raw.customer || {};
  const customer =
    typeof custRaw === 'string'
      ? custRaw
      : {
          id:      custRaw.id    || raw.customer_id || null,
          name:    custRaw.name  || custRaw.full_name || '—',
          email:   custRaw.email || null,
          phone:   custRaw.phone || null,
          account: custRaw.account || custRaw.company || raw.company?.name || null,
        };

  // ── account / company ──
  const compRaw = raw.company || raw.account || {};
  const account =
    typeof compRaw === 'string'
      ? compRaw
      : {
          id:     compRaw.id    || raw.company_id || null,
          name:   compRaw.name  || '—',
          email:  compRaw.email || null,
          phone:  compRaw.phone || null,
          crm:    compRaw.crm   || crm,
          tickets: compRaw.tickets || null,
        };

  return {
    // identifiers
    id:          raw.id,
    crm_id:      raw.crm_ticket_id || raw.crm_id || `#${raw.id}`,

    // core fields
    title:       raw.title       || '(no title)',
    description: raw.description || '',
    status,
    priority,
    crm,

    // relations
    assignee,
    customer,
    account,

    // timestamps
    created:  raw.created_at  || raw.created  || null,
    updated:  raw.updated_at  || raw.updated  || raw.created_at || null,

    // pass through anything else
    ...( raw._raw ? {} : { _raw: raw } ),
  };
}

export function normalizeTickets(list) {
  if (!Array.isArray(list)) return [];
  return list.map(normalizeTicket);
}
