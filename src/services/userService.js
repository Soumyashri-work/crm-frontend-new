import api from './api';

// ---------------------------------------------------------------------------
// Query key factory  (mirrors ticketKeys pattern)
// ---------------------------------------------------------------------------
export const userKeys = {
  all:    ()             => ['users'],
  lists:  ()             => ['users', 'list'],
  list:   (params = {})  => ['users', 'list', params],
  detail: (id)           => ['users', 'detail', id],
};

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------
function unwrap(response) {
  const body = response.data;
  // Support both { success, data } envelope and plain payloads
  if (typeof body?.success === 'boolean') {
    if (!body.success) {
      const err    = new Error(body.message || 'An unexpected error occurred');
      err.status   = response.status;
      throw err;
    }
    return body.data;
  }
  // Plain response — return as-is
  return body;
}

function normalizeUser(u) {
  if (!u) return u;
  return {
    ...u,
    name:   (u.name ?? `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim()) || '—',
    status: u.status ?? (u.is_active ? 'Active' : 'Inactive'),
    role:   u.role   ?? 'Agent',
  };
}

// ---------------------------------------------------------------------------
// User service
// ---------------------------------------------------------------------------
export const userService = {
  /** GET /users/ */
  getAll: async (params = {}) => {
    const res  = await api.get('/users/', { params });
    const data = unwrap(res);
    // Handle both paginated { items, total } and plain array
    if (Array.isArray(data)) {
      return { items: data.map(normalizeUser), total: data.length, total_pages: 1 };
    }
    return {
      ...data,
      items: (data.items ?? []).map(normalizeUser),
    };
  },

  /** GET /users/{id} */
  getById: async (id) => {
    const res = await api.get(`/users/${id}`);
    return normalizeUser(unwrap(res));
  },

  create:          (data)     => api.post('/users/', data),
  update:          (id, data) => api.put(`/users/${id}`, data),
  delete:          (id)       => api.delete(`/users/${id}`),
  updateProfile:   (data)     => api.put('/users/me/profile', data),
  changePassword:  (data)     => api.put('/users/me/password', data),
};
