/**
 * services/ticketService.js
 *
 * All ticket API calls + React Query key factories.
 *
 * Key shape (follow the hierarchy so partial invalidation works):
 *   ['tickets']                              – all tickets namespace
 *   ['tickets', 'list', params]              – paginated admin list
 *   ['tickets', 'byAgent', agentId, params]  – agent-scoped list
 *   ['tickets', 'detail', id]                – single ticket
 *   ['tickets', 'comments', ticketId, params]– comments for a ticket
 *   ['tickets', 'stats']                     – global stats
 *   ['tickets', 'agentStats', agentId]       – per-agent stats
 */

import api from './api';

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------
export const ticketKeys = {
  all:         ()                         => ['tickets'],
  lists:       ()                         => ['tickets', 'list'],
  list:        (params = {})              => ['tickets', 'list', params],
  byAgent:     (agentId, params = {})     => ['tickets', 'byAgent', agentId, params],
  details:     ()                         => ['tickets', 'detail'],
  detail:      (id)                       => ['tickets', 'detail', id],
  comments:    (ticketId, params = {})    => ['tickets', 'comments', ticketId, params],
  stats:       ()                         => ['tickets', 'stats'],
  agentStats:  (agentId)                  => ['tickets', 'agentStats', agentId],
};

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function unwrap(response) {
  const body = response.data;
  if (!body.success) {
    const err    = new Error(body.message || 'An unexpected error occurred');
    err.status   = response.status;
    err.data     = body.data;
    throw err;
  }
  return body.data;
}

function normalizeTicket(t) {
  if (!t) return t;

  const agent    = t.agent    ?? t.assignee ?? null;
  const customer = t.customer ?? null;
  const company  = t.company  ?? t.account  ?? null;

  return {
    ...t,
    crm:    (t.source_system ?? t.crm)    ?? '—',
    crm_id: (t.crm_ticket_id ?? t.crm_id) ?? '—',
    created:(t.created_at    ?? t.created) ?? null,
    updated:(t.updated_at    ?? t.updated) ?? null,

    assignee: agent
      ? {
          ...agent,
          name: agent.name
            ?? (`${agent.first_name ?? ''} ${agent.last_name ?? ''}`.trim() || '—'),
        }
      : null,

    customer: customer
      ? {
          ...customer,
          name: customer.name
            ?? (`${customer.first_name ?? ''} ${customer.last_name ?? ''}`.trim() || '—'),
        }
      : null,

    account: company
      ? {
          ...company,
          name: (company.company_name ?? company.name) ?? '—',
        }
      : null,
  };
}

// ---------------------------------------------------------------------------
// Ticket service
// ---------------------------------------------------------------------------
export const ticketService = {

  /** GET /api/v1/tickets/ */
  getAll: async (params = {}) => {
    const res  = await api.get('/tickets/', { params });
    const data = unwrap(res);
    return { ...data, items: (data.items ?? []).map(normalizeTicket) };
  },

  /** GET /api/v1/tickets/filter - Filter tickets by source, status, or priority */
  filter: async (params = {}) => {
    const res  = await api.get('/tickets/filter', { params });
    const data = unwrap(res);
    return { ...data, items: (data.items ?? []).map(normalizeTicket) };
  },

  /** GET /api/v1/tickets/{id} */
  getById: async (id) => {
    const res = await api.get(`/tickets/${id}`);
    return normalizeTicket(unwrap(res));
  },

  /** GET /api/v1/tickets/stats */
  getStats: async () => {
    const res = await api.get('/tickets/stats');
    return unwrap(res);
  },

  /** GET /api/v1/tickets/by-agent/{agentId} */
  getByAgent: async (agentId, params = {}) => {
    const res  = await api.get(`/tickets/by-agent/${agentId}`, { params });
    const data = unwrap(res);
    return { ...data, items: (data.items ?? []).map(normalizeTicket) };
  },

  /** GET /api/v1/tickets/stats/agent/{agentId} */
  getAgentStats: async (agentId) => {
    const res = await api.get(`/tickets/stats/agent/${agentId}`);
    return unwrap(res);
  },

  /** GET /api/v1/tickets/{ticketId}/comments */
  getComments: async (ticketId, params = {}) => {
    const res  = await api.get(`/tickets/${ticketId}/comments`, { params });
    return unwrap(res); // { items, total, page, page_size, total_pages }
  },

/** POST /api/v1/sync/{ticketId}/comments/sync */
syncComments: async (ticketId) => {
  const res = await api.post(`/sync/${ticketId}/comments/sync`);
  return unwrap(res);
},

  /** POST /api/v1/tickets/ */
  create: (data)        => api.post('/tickets/', data),

  /** PUT /api/v1/tickets/{id} */
  update: (id, data)    => api.put(`/tickets/${id}`, data),

  /** DELETE /api/v1/tickets/{id} */
  delete: (id, data)    => api.delete(`/tickets/${id}`, { data }),

  /** POST /api/v1/tickets/{id}/comments */
  addComment: (id, data) => api.post(`/tickets/${id}/comments`, data),
};