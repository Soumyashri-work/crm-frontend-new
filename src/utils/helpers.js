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

const AGENT_STATUS_LABELS = {
  not_invited: 'Not Invited',
  pending: 'Pending',
  expired: 'Expired',
  rejected: 'Rejected',
  active: 'Active',
};

export function normalizeAgentStatus(status, isActive) {
  const raw = String(status || '').toLowerCase().trim().replace(/\s+/g, '_');

  if (['active', 'accepted', 'enabled'].includes(raw)) return 'active';
  if (['pending', 'invited', 'invite_sent'].includes(raw)) return 'pending';
  if (['expired', 'invite_expired'].includes(raw)) return 'expired';
  if (['rejected'].includes(raw)) return 'rejected';

  if (['not_invited', 'not-invited', 'inactive', 'new', 'uninvited'].includes(raw)) {
    return 'not_invited';
  }

  if (typeof isActive === 'boolean') {
    return isActive ? 'active' : 'not_invited';
  }

  return 'not_invited';
}

export function getAgentStatusMeta(status) {
  const key = normalizeAgentStatus(status);
  const badgeClass = key === 'active'
    ? 'badge-success'
    : key === 'pending'
      ? 'badge-warning'
      : 'badge-danger';

  return {
    key,
    label: AGENT_STATUS_LABELS[key] || AGENT_STATUS_LABELS.not_invited,
    badgeClass,
  };
}

export function getAgentActiveStatus(agent) {
  const isActive = agent?.is_active ?? agent?.active ?? false;
  return isActive ? 'Active' : 'Inactive';
}

export function getAgentIsActive(agent) {
  return agent?.is_active ?? agent?.active ?? false;
}

export function getAgentRouteSlug(agent) {
  const raw =
    agent?.public_slug ||
    agent?.slug ||
    agent?.email ||
    agent?.name ||
    'agent';

  const slug = String(raw)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  return slug || 'agent';
}

/**
 * Extract CRM source references from an agent object.
 *
 * Returns an array of values that are either:
 *   - display-name strings  (e.g. "EspoCRM")  — ready to render
 *   - numeric-id strings    (e.g. "3")         — caller must resolve via sourceSystems
 *
 * The function intentionally does NOT resolve IDs to names here because it
 * doesn't have access to the tenant sourceSystems list. The Agents page
 * column renderer does the ID→name resolution after calling this.
 */
export function getAgentCrmSources(agent) {
  if (!agent) return [];

  // ── 1. Array fields (preferred — most complete) ──────────────────────────
  const arrayFields = [
    'source_systems',
    'crm_sources',
    'crms',
    'sources',
  ];

  for (const field of arrayFields) {
    const val = agent[field];
    if (Array.isArray(val) && val.length > 0) {
      const normalized = val
        .map((c) => {
          if (!c) return null;
          if (typeof c === 'string') return c.trim() || null;
          if (typeof c === 'object') {
            // Return display name if present, else fall back to ID string
            // so the caller can resolve it.
            return (
              c.system_name ??
              c.name ??
              c.systemName ??
              (c.id != null ? String(c.id) : null) ??
              (c.source_system_id != null ? String(c.source_system_id) : null)
            );
          }
          return String(c);
        })
        .filter(Boolean);

      if (normalized.length > 0) {
        return [...new Set(normalized)];
      }
    }
  }

  // ── 2. Comma-separated string arrays ────────────────────────────────────
  for (const field of arrayFields) {
    const val = agent[field];
    if (typeof val === 'string' && val.trim()) {
      const parts = val.split(',').map((s) => s.trim()).filter(Boolean);
      if (parts.length > 0) return [...new Set(parts)];
    }
  }

  // ── 3. Singular object/string fields ────────────────────────────────────
  // Covers source_system (object or string), crm (string), source_system_name
  const singularFields = [
    'source_system',
    'crm',
    'source_system_name',
    'source',
  ];

  for (const field of singularFields) {
    const val = agent[field];
    if (!val) continue;

    if (typeof val === 'object') {
      const name =
        val.system_name ??
        val.name ??
        val.systemName ??
        (val.id != null ? String(val.id) : null);
      if (name) return [name];
    }

    if (typeof val === 'string' && val.trim()) {
      return [val.trim()];
    }

    if (typeof val === 'number') {
      return [String(val)];
    }
  }

  return [];
}

export function getAgentTicketsCount(agent) {
  const val =
    agent?.tickets_count ??
    agent?.assigned_tickets ??
    agent?.ticket_count ??
    agent?.tickets ??
    0;

  return Number.isFinite(Number(val)) ? Number(val) : 0;
}

export function displayCrmBadges(crms, maxDisplay = 2) {
  return {
    visible: crms.slice(0, maxDisplay),
    hidden: crms.slice(maxDisplay),
    hasMore: crms.length > maxDisplay,
  };
}

export function truncate(str, n = 40) {
  if (!str) return '';
  return str.length > n ? str.slice(0, n) + '…' : str;
}

// ── Ticket field normalizer ──────────────────────────────────────────────────
export function normalizeTicket(raw) {
  if (!raw) return null;

  const status =
    raw.status?.name ||
    raw.status_name ||
    (typeof raw.status === 'string' ? raw.status : null) ||
    raw.status_id?.toString() ||
    'Open';

  const priority =
    raw.priority?.name ||
    raw.priority_name ||
    (typeof raw.priority === 'string' ? raw.priority : null) ||
    raw.priority_id?.toString() ||
    'Medium';

  const crm =
    raw.source_system?.name ||
    raw.source_system_name ||
    (typeof raw.crm === 'string' ? raw.crm : null) ||
    'EspoCRM';

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

  const compRaw = raw.company || raw.account || {};
  const account =
    typeof compRaw === 'string'
      ? compRaw
      : {
          id:      compRaw.id    || raw.company_id || null,
          name:    compRaw.name  || '—',
          email:   compRaw.email || null,
          phone:   compRaw.phone || null,
          crm:     compRaw.crm   || crm,
          tickets: compRaw.tickets || null,
        };

  return {
    id:          raw.id,
    crm_id:      raw.crm_ticket_id || raw.crm_id || `#${raw.id}`,
    title:       raw.title       || '(no title)',
    description: raw.description || '',
    status,
    priority,
    crm,
    assignee,
    customer,
    account,
    created:  raw.created_at  || raw.created  || null,
    updated:  raw.updated_at  || raw.updated  || raw.created_at || null,
    ...( raw._raw ? {} : { _raw: raw } ),
  };
}

export function normalizeTickets(list) {
  if (!Array.isArray(list)) return [];
  return list.map(normalizeTicket);
}