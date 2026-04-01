import api from './api';
import {
  normalizeAgentStatus,
  getAgentRouteSlug,
  getAgentCrmSources,
  getAgentTicketsCount,
  getAgentStatusMeta,
} from '../utils/helpers';

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

  const statusKey = normalizeAgentStatus(a.status, a.is_active);
  const statusLabel = getAgentStatusMeta(statusKey).label;

  return {
    ...a,
    name: (a.name ?? `${a.first_name ?? ''} ${a.last_name ?? ''}`.trim()) || '—',
    status_key: statusKey,
    status: statusLabel,
    source: a.source_system ?? a.source ?? '—',
    crm_sources: getAgentCrmSources({
      ...a,
      source: a.source_system ?? a.source,
    }),
    tickets_count: getAgentTicketsCount(a),
    route_slug: getAgentRouteSlug({
      ...a,
      name: (a.name ?? `${a.first_name ?? ''} ${a.last_name ?? ''}`.trim()) || 'agent',
      email: a.email,
    }),
  };
}

async function postFirstAvailable(requests, payload) {
  let lastError = null;

  for (const req of requests) {
    try {
      const res = await api.post(req, payload);
      return unwrap(res);
    } catch (err) {
      lastError = err;
      if (![404, 405].includes(err?.status)) {
        throw err;
      }
    }
  }

  throw lastError || new Error('No supported endpoint found for this action.');
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

  getBySlug: async (slug) => {
    const normalizedSlug = String(slug || '').trim().toLowerCase();
    if (!normalizedSlug) throw new Error('Missing agent slug.');

    const list = await agentService.getAll({
      page: 1,
      page_size: 500,
      include_inactive: true,
    });

    const found = (list.items || []).find(
      (a) => String(a.route_slug || '').toLowerCase() === normalizedSlug,
    );

    if (!found?.id) {
      throw new Error('Agent not found.');
    }

    return agentService.getById(found.id);
  },

  invite: (id) => postFirstAvailable([
    `/agents/${id}/invite`,
    '/agents/invite',
  ], { agent_id: id }),

  resendInvite: (id) => postFirstAvailable([
    `/agents/${id}/resend-invite`,
    `/agents/${id}/invite/resend`,
    '/agents/invite/resend',
  ], { agent_id: id }),

  bulkInvite: (ids) => postFirstAvailable([
    '/agents/invite/bulk',
    '/agents/bulk-invite',
  ], { agent_ids: ids }),

  create:  (data)     => api.post('/agents/', data),
  update:  (id, data) => api.put(`/agents/${id}`, data),
  delete:  (id)       => api.delete(`/agents/${id}`),
};