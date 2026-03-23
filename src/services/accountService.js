import api from './api';

function unwrap(response) {
  const body = response.data;
  if (!body.success) {
    const err = new Error(body.message || 'An unexpected error occurred');
    err.status = response.status;
    throw err;
  }
  return body.data;
}

function normalizeAccount(a) {
  if (!a) return a;
  return {
    ...a,
    // field renames
    name:   a.company_name    ?? a.name   ?? '—',
    crm:    a.source_system   ?? a.crm    ?? '—',
    crm_id: a.crm_company_id  ?? a.crm_id ?? '—',
  };
}

export const accountService = {
  getAll: async (params = {}) => {
    const res  = await api.get('/companies/', { params });
    const data = unwrap(res);
    return {
      ...data,
      items: (data.items ?? []).map(normalizeAccount),
    };
  },

  getById: async (id) => {
    const res = await api.get(`/companies/${id}`);
    return normalizeAccount(unwrap(res));
  },

  create: (data) => api.post('/companies/', data),
  update: (id, data) => api.put(`/companies/${id}`, data),
  delete: (id) => api.delete(`/companies/${id}`),
};