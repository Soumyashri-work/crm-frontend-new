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
   * Payload: { name, contact_email }
   */
  createTenant: async (data) => {
    const contact_email = data.contact_email ?? data.email;
    const payload = { name: data.name, contact_email };
    const res = await api.post('/super-admin/tenants', payload);
    return unwrap(res);
  },

  /**
   * PATCH /api/v1/super-admin/tenants/:id
   * Payload (all optional): { name, contact_email, is_active }
   */
  updateTenant: async (tenantId, data) => {
    // Build a clean patch payload — only include fields that were provided
    const payload = {};
    if (data.name          != null) payload.name          = data.name;
    if (data.contact_email != null) payload.contact_email = data.contact_email;
    if (data.is_active     != null) payload.is_active     = data.is_active;

    const res = await api.patch(`/super-admin/tenants/${tenantId}`, payload);
    return unwrap(res);
  },

  /**
   * DELETE /api/v1/super-admin/tenants/:id
   * Returns: { deleted: true, tenant_id }
   */
  deleteTenant: async (tenantId) => {
    const res = await api.delete(`/super-admin/tenants/${tenantId}`);
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

  /**
   * PATCH /api/v1/super-admin/admins/:id
   * Payload (all optional): { name, email, is_active }
   */
  updateAdmin: async (adminId, data) => {
    const payload = {};
    if (data.name      != null) payload.name      = data.name;
    if (data.email     != null) payload.email     = data.email;
    if (data.is_active != null) payload.is_active = data.is_active;

    const res = await api.patch(`/super-admin/admins/${adminId}`, payload);
    return unwrap(res);
  },

  /**
   * DELETE /api/v1/super-admin/admins/:id
   * Returns: { deleted: true, admin_id }
   */
  deleteAdmin: async (adminId) => {
    const res = await api.delete(`/super-admin/admins/${adminId}`);
    return unwrap(res);
  },

  // ── Users ─────────────────────────────────────────────────────────────────

  /** GET /api/v1/super-admin/users */
  getUsers: async (params = {}) => {
    const res = await api.get('/super-admin/users', { params });
    return unwrap(res);
  },
};