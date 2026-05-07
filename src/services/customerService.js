import api from './api';

// ---------------------------------------------------------------------------
// Query key factory  (mirrors ticketKeys pattern)
// ---------------------------------------------------------------------------
export const customerKeys = {
  all:    ()             => ['customers'],
  lists:  ()             => ['customers', 'list'],
  list:   (params = {})  => ['customers', 'list', params],
  detail: (id)           => ['customers', 'detail', id],
};

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------
function unwrap(response) {
  const body = response.data;
  if (!body.success) {
    const err    = new Error(body.message || 'An unexpected error occurred');
    err.status   = response.status;
    throw err;
  }
  return body.data;
}

function normalizeCustomer(c) {
  if (!c) return c;
  // Normalize source_system which may be an object ({ system_name, name }) or a string
  const crmVal =
    (c.source_system && typeof c.source_system === 'object')
      ? (c.source_system.system_name || c.source_system.name || null)
      : c.source_system;

  const crmFallback =
    (c.crm && typeof c.crm === 'object')
      ? (c.crm.system_name || c.crm.name || null)
      : c.crm;

  return {
    ...c,
    name:   c.name ?? '—',
    crm:    crmVal ?? crmFallback ?? '—',
    crm_id: c.crm_customer_id ?? c.crm_id ?? '—',
  };
}

// ---------------------------------------------------------------------------
// Customer service
// ---------------------------------------------------------------------------
export const customerService = {
  /** GET /customers/ */
  getAll: async (params = {}) => {
    // Backend query param naming is inconsistent across endpoints.
    // If caller passed `source`, also send it as `source_system` for compatibility.
    const qp = { ...params };
    if (qp.source && !qp.source_system) {
      qp.source_system = qp.source;
      delete qp.source;
    }

    const res  = await api.get('/customers/', { params: qp });
    const data = unwrap(res);
    return {
      ...data,
      items: (data.items ?? []).map(normalizeCustomer),
    };
  },

  /** GET /customers/{id} */
  getById: async (id) => {
    const res = await api.get(`/customers/${id}`);
    return normalizeCustomer(unwrap(res));
  },

  create: (data)     => api.post('/customers/', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  delete: (id)       => api.delete(`/customers/${id}`),
};
