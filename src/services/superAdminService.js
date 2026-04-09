/**
 * services/superAdminService.js
 *
 * All Super Admin API calls + React Query key factories.
 *
 * Key shape:
 *   ['superAdmin', 'sourceSystems']              – source systems list
 *   ['superAdmin', 'tenants', 'list', params]    – paginated tenant list
 *   ['superAdmin', 'admins',  'list', params]    – paginated admin list
 *   ['superAdmin', 'users',   'list', params]    – all users list
 */

import api from './api';

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------
export const superAdminKeys = {
  all:           ()            => ['superAdmin'],

  sourceSystems: ()            => ['superAdmin', 'sourceSystems'],

  tenants:       ()            => ['superAdmin', 'tenants', 'list'],
  tenant:        (params = {}) => ['superAdmin', 'tenants', 'list', params],

  admins:        ()            => ['superAdmin', 'admins', 'list'],
  admin:         (params = {}) => ['superAdmin', 'admins', 'list', params],

  users:         ()            => ['superAdmin', 'users', 'list'],
  user:          (params = {}) => ['superAdmin', 'users', 'list', params],
};

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Unwraps a standard { success, message, data } envelope.
 *
 * Defensive against:
 *  - null / undefined response body
 *  - non-envelope shaped responses (e.g. plain arrays from some proxies)
 *  - missing message field
 */
function unwrap(response) {
  const body = response?.data;

  // Guard: body is missing entirely (network-level or proxy error)
  if (body == null) {
    const err = new Error('No response body received from the server.');
    err.status = response?.status;
    throw err;
  }

  // Guard: body is not an envelope (e.g. the API returned a raw array/string)
  if (typeof body !== 'object' || !('success' in body)) {
    // Treat it as successful raw data so callers get *something* usable.
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
// Super Admin service
// ---------------------------------------------------------------------------
export const superAdminService = {

  // ── Source Systems ─────────────────────────────────────────────────────────

  /** GET /api/v1/super-admin/source-systems */
  getSourceSystems: async () => {
    const res = await api.get('/super-admin/source-systems');
    return unwrap(res); // [{ id, system_name }]
  },

  // ── Tenants ───────────────────────────────────────────────────────────────

  /** GET /api/v1/super-admin/tenants */
  getTenants: async (params = {}) => {
    const res = await api.get('/super-admin/tenants', { params });
    return unwrap(res);
  },

  /**
   * POST /api/v1/super-admin/tenants
   *
   * Accepts either of these caller shapes and normalises to what the backend
   * expects: { name, contact_email, source_system_ids: number[] }
   *
   * Caller shape A (multi-select, already correct):
   *   { name, contact_email, source_system_ids: [1, 2] }
   *
   * Caller shape B (legacy single-id from old form):
   *   { name, contact_email, source_system_id: 1 }
   *
   * Caller shape C (form passes email as "email" key):
   *   { name, email, source_system_ids: [1] }  or  { name, email, source_system_id: 1 }
   */
  createTenant: async (data) => {
    // --- normalise contact_email -----------------------------------------------
    const contact_email = data.contact_email ?? data.email;

    // --- normalise source_system_ids -------------------------------------------
    let source_system_ids;
    if (Array.isArray(data.source_system_ids) && data.source_system_ids.length > 0) {
      source_system_ids = data.source_system_ids;
    } else if (data.source_system_id != null) {
      source_system_ids = [data.source_system_id];
    } else {
      source_system_ids = [];
    }

    const payload = { name: data.name, contact_email, source_system_ids };

    const res = await api.post('/super-admin/tenants', payload);
    return unwrap(res);
  },

  // ── Admins ────────────────────────────────────────────────────────────────

  /** GET /api/v1/super-admin/admins */
  getAdmins: async (params = {}) => {
    const res = await api.get('/super-admin/admins', { params });
    return unwrap(res);
  },

  /**
   * POST /api/v1/super-admin/admins/invite
   * @param {{ tenant_id: string, admin_email: string, first_name: string, last_name: string }} data
   */
  inviteAdmin: async (data) => {
    const res = await api.post('/super-admin/admins/invite', data);
    return unwrap(res);
  },

  // ── Users ─────────────────────────────────────────────────────────────────

  /** GET /api/v1/super-admin/users */
  getUsers: async (params = {}) => {
    const res = await api.get('/super-admin/users', { params });
    return unwrap(res);
  },
};