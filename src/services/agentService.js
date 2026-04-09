/**
 * services/agentService.js
 *
 * All Agent API calls + React Query key factories.
 *
 * Key shape:
 *   ['agents', 'list', params]   – paginated list / filtered list
 *   ['agents', 'detail', slug]   – single agent by slug
 */

import api from './api';

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------
export const agentKeys = {
  all:    ()             => ['agents'],
  list:   (params = {})  => ['agents', 'list', params],
  detail: (slug)         => ['agents', 'detail', slug],
};

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Unwraps a standard { success, message, data } envelope.
 * Falls back gracefully for plain-array or raw-object responses.
 */
function unwrap(response) {
  const body = response?.data;

  if (body == null) {
    const err = new Error('No response body received from the server.');
    err.status = response?.status;
    throw err;
  }

  if (typeof body !== 'object' || !('success' in body)) {
    return body;
  }

  if (!body.success) {
    const err  = new Error(body.message?.trim() || 'An unexpected error occurred.');
    err.status = response?.status;
    err.data   = body.data ?? null;
    throw err;
  }

  return body.data;
}

// ---------------------------------------------------------------------------
// Agent service
// ---------------------------------------------------------------------------
export const agentService = {

  // ── List / filter ─────────────────────────────────────────────────────────

  /** GET /api/v1/agents?page=1&page_size=20&include_inactive=true */
  getAll: async (params = {}) => {
    const res = await api.get('/agents', { params });
    return unwrap(res);
  },

  /**
   * GET /api/v1/agents/filter?source=zammad&...
   * Used when a source filter is active.
   */
  filter: async (params = {}) => {
    const res = await api.get('/agents/filter', { params });
    return unwrap(res);
  },

  // ── Single agent ──────────────────────────────────────────────────────────

  /** GET /api/v1/agents/:slug */
  getBySlug: async (slug) => {
    const res = await api.get(`/agents/${slug}`);
    return unwrap(res);
  },

  // ── Mutations ─────────────────────────────────────────────────────────────

  /** PUT /api/v1/agents/:id */
  update: async (id, data) => {
    const res = await api.put(`/agents/${id}`, data);
    return unwrap(res);
  },

  /** DELETE /api/v1/agents/:id */
  delete: async (id) => {
    const res = await api.delete(`/agents/${id}`);
    return unwrap(res);
  },

  // ── Invitations ───────────────────────────────────────────────────────────

  /**
   * POST /api/v1/invitations/invite-agent
   *
   * Called by an org admin to invite a new agent.
   * Requires admin JWT (sent automatically via axios interceptor).
   *
   * @param {{
   *   email:      string,
   *   first_name: string,
   *   last_name:  string,
   *   name:       string,
   *   role:       string   // always "agent"
   * }} data
   */
  inviteAgent: async (data) => {
    const res = await api.post('/invitations/invite-agent', data);
    return unwrap(res);
  },

  /**
   * POST /api/v1/agents/:id/invite
   * Invite a single already-imported agent (status: not_invited).
   */
  invite: async (id) => {
    const res = await api.post(`/agents/${id}/invite`);
    return unwrap(res);
  },

  /**
   * POST /api/v1/agents/:id/resend-invite
   * Resend an invite to an agent whose previous invite expired.
   */
  resendInvite: async (id) => {
    const res = await api.post(`/agents/${id}/resend-invite`);
    return unwrap(res);
  },

  /**
   * POST /api/v1/agents/bulk-invite
   * Invite multiple not_invited agents in one call.
   * @param {string[]} ids
   */
  bulkInvite: async (ids) => {
    const res = await api.post('/agents/bulk-invite', { agent_ids: ids });
    return unwrap(res);
  },
};