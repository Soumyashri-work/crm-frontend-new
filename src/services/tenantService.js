/**
 * services/tenantService.js
 *
 * Tenant-scoped API calls + React Query key factories.
 *
 * Key shape:
 * ['tenant', 'me']            – current user's tenant info
 * ['tenant', 'sourceSystems'] – active CRMs for the current tenant
 */

import api from './api';

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------
export const tenantKeys = {
  all: () => ['tenant'],
  me:  () => ['tenant', 'me'],
  sourceSystems: () => ['tenant', 'sourceSystems'],
};

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Unwraps a standard { success, message, data } envelope.
 * Falls back gracefully for non-envelope responses.
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
// Tenant service
// ---------------------------------------------------------------------------
export const tenantService = {

  /**
   * GET /api/v1/tenants/me
   * Returns { id, name, slug } for the currently authenticated user.
   */
  getMyTenant: async () => {
    const res = await api.get('/tenants/me');
    return unwrap(res);
  },

  /**
   * GET /api/v1/tenants/me/source-systems
   * Returns the array of configured source CRMs (e.g., [{id: 1, system_name: "espocrm"}])
   */
  getSourceSystems: async () => {
    const res = await api.get('/tenants/me/source-systems');
    return unwrap(res);
  },

  // Add/Ensure this in tenantService.js
getSourceSystems: async () => {
  const res = await api.get('/tenants/me/source-systems');
  return unwrap(res);
},
};