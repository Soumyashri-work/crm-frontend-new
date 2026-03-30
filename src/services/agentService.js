import api from './api';

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------
export const agentKeys = {
  all:    ()             => ['agents'],
  lists:  ()             => ['agents', 'list'],
  list:   (params = {})  => ['agents', 'list', params],
  detail: (id)           => ['agents', 'detail', id],
};

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------
function unwrap(response) {
  const body = response.data;
  if (typeof body?.success === 'boolean') {
    if (!body.success) {
      const err  = new Error(body.message || 'An unexpected error occurred');
      err.status = response.status;
      throw err;
    }
    return body.data;
  }
  return body;
}

function normalizeAgent(a) {
  if (!a) return a;
  return {
    ...a,
    name:   (a.name ?? `${a.first_name ?? ''} ${a.last_name ?? ''}`.trim()) || '—',
    status: a.is_active !== undefined
      ? (a.is_active ? 'Active' : 'Inactive')
      : (a.status ?? 'Active'),
    source: a.source_system ?? a.source ?? '—',
  };
}

// ---------------------------------------------------------------------------
// Agent service
// ---------------------------------------------------------------------------
export const agentService = {
  /** GET /agents/?page=&page_size=&include_inactive= */
  getAll: async (params = {}) => {
    const res  = await api.get('/agents/', { params });
    const data = unwrap(res);
    if (Array.isArray(data)) {
      return { items: data.map(normalizeAgent), total: data.length, total_pages: 1 };
    }
    return {
      ...data,
      items: (data.items ?? []).map(normalizeAgent),
    };
  },

  /** GET /agents/filter?source=&include_inactive=&page=&page_size= */
  filter: async (params = {}) => {
    const res  = await api.get('/agents/filter', { params });
    const data = unwrap(res);
    if (Array.isArray(data)) {
      return { items: data.map(normalizeAgent), total: data.length, total_pages: 1 };
    }
    return {
      ...data,
      items: (data.items ?? []).map(normalizeAgent),
    };
  },

  /** GET /agents/{id} */
  getById: async (id) => {
    const res = await api.get(`/agents/${id}`);
    return normalizeAgent(unwrap(res));
  },

  create:  (data)     => api.post('/agents/', data),
  update:  (id, data) => api.put(`/agents/${id}`, data),
  delete:  (id)       => api.delete(`/agents/${id}`),
};