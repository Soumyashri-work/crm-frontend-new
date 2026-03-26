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
  return {
    ...c,
    name:   `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim() || '—',
    crm:    c.source_system   ?? c.crm    ?? '—',
    crm_id: c.crm_customer_id ?? c.crm_id ?? '—',
  };
}

// ---------------------------------------------------------------------------
// Customer service
// ---------------------------------------------------------------------------
export const customerService = {
  /** GET /customers/ */
  getAll: async (params = {}) => {
    const res  = await api.get('/customers/', { params });
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
