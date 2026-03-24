/**
 * services/ticketService.js
 *
 * All ticket API calls.
 *
 * Backend response shapes:
 *   List:   { success, message, data: { items, total, page, page_size, total_pages } }
 *   Single: { success, message, data: { id, title, status, priority, agent, customer, ... } }
 *   Error:  { success: false, message: "...", data: null }
 *
 * Every method returns the parsed data directly — callers never
 * need to unwrap the envelope manually.
 */

import api from './api';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Unwrap the standard { success, message, data } envelope.
 * Throws an error with the backend message if success=false.
 */
function unwrap(response) {
  const body = response.data;

  if (!body.success) {
    const err = new Error(body.message || 'An unexpected error occurred');
    err.status = response.status;
    err.data   = body.data;
    throw err;
  }

  return body.data;
}

/**
 * Normalize a raw ticket object from the backend into the shape
 * the frontend components expect.
 *
 * Backend field  →  Frontend field
 * ─────────────────────────────────
 * source_system  →  crm
 * crm_ticket_id  →  crm_id
 * created_at     →  created
 * updated_at     →  updated
 * agent          →  assignee  (with .name resolved)
 * customer       →  customer  (with .name resolved from first+last)
 * company        →  account
 */
function normalizeTicket(t) {
  if (!t) return t;

  const agent    = t.agent    ?? t.assignee ?? null;
  const customer = t.customer ?? null;
  const company  = t.company  ?? t.account  ?? null;

  return {
    ...t,

    crm:     (t.source_system ?? t.crm)    ?? '—',
    crm_id:  (t.crm_ticket_id ?? t.crm_id) ?? '—',
    created: (t.created_at    ?? t.created) ?? null,
    updated: (t.updated_at    ?? t.updated) ?? null,

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

  /**
   * Fetch paginated ticket list.
   *
   * @param {Object} params - Query params: page, page_size, include_deleted
   * @returns {{ items, total, page, page_size, total_pages }}
   *
   * Backend: GET /api/v1/tickets/
   */
  getAll: async (params = {}) => {
    const res  = await api.get('/tickets/', { params });
    const data = unwrap(res);
    return {
      ...data,
      items: (data.items ?? []).map(normalizeTicket),
    };
  },

  /**
   * Fetch tickets filtered by CRM source system.
   *
   * @param {'zammad'|'espocrm'} source
   * @param {Object} params - page, page_size, include_deleted
   * @returns {{ items, total, page, page_size, total_pages }}
   *
   * Backend: GET /api/v1/tickets/source/{source}
   */
  getBySource: async (source, params = {}) => {
    const res  = await api.get(`/tickets/source/${source}`, { params });
    const data = unwrap(res);
    return {
      ...data,
      items: (data.items ?? []).map(normalizeTicket),
    };
  },

  /**
   * Fetch a single ticket by internal UUID.
   *
   * @param {string} id - Internal ticket UUID
   * @returns {Object} Full ticket detail with nested agent, customer, company
   *
   * Backend: GET /api/v1/tickets/{id}
   */
  getById: async (id) => {
    const res = await api.get(`/tickets/${id}`);
    return normalizeTicket(unwrap(res));
  },

  /**
   * Fetch ticket stats for the dashboard.
   * Returns total, active, deleted counts and a breakdown by status.
   *
   * Backend: GET /api/v1/tickets/stats
   */
  getStats: async () => {
    const res = await api.get('/tickets/stats');
    return unwrap(res);
    // returns: { total, active, deleted, by_status: { open: N, pending: N, closed: N } }
  },

  /** Create a ticket */
  create: (data) => api.post('/tickets/', data),

  /** Update a ticket */
  update: (id, data) => api.put(`/tickets/${id}`, data),

  /** Soft delete a ticket */
  delete: (id, data) => api.delete(`/tickets/${id}`, { data }),

  /** Add a comment to a ticket */
  addComment: (id, data) => api.post(`/tickets/${id}/comments`, data),


getByAgent: async (agentId, params = {}) => {
  const res  = await api.get(`/tickets/by-agent/${agentId}`, { params });
  const data = unwrap(res);
  return {
    ...data,
    items: (data.items ?? []).map(normalizeTicket),
  };
},

getAgentStats: async (agentId) => {
  const res = await api.get(`/tickets/stats/agent/${agentId}`);
  return unwrap(res);
},

};