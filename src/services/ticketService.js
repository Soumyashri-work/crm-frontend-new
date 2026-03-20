import api from './api';
import { normalizeTicket, normalizeTickets } from '../utils/helpers';

// Helper: extract the items array from various API response shapes
//   { items: [...] }  |  { data: [...] }  |  { results: [...] }  |  [...]
function extractList(responseData) {
  if (!responseData) return [];
  if (Array.isArray(responseData)) return responseData;
  if (Array.isArray(responseData.items))   return responseData.items;
  if (Array.isArray(responseData.data))    return responseData.data;
  if (Array.isArray(responseData.results)) return responseData.results;
  return [];
}

export const ticketService = {
  /** Fetch all tickets, normalize each one */
  getAll: async (params) => {
    const res = await api.get('/tickets', { params });
    const raw  = extractList(res.data);
    return {
      ...res,
      data: {
        items: normalizeTickets(raw),
        total: res.data?.total ?? res.data?.count ?? raw.length,
        // pass through pagination meta if present
        page:  res.data?.page,
        pages: res.data?.pages,
      },
    };
  },

  /** Fetch a single ticket, normalize it */
  getById: async (id) => {
    const res = await api.get(`/tickets/${id}`);
    return { ...res, data: normalizeTicket(res.data) };
  },

  /** Stats endpoint – returned as-is (no normalization needed) */
  getStats: () => api.get('/tickets/stats'),

  /** CRUD – unchanged */
  create:     (data)     => api.post('/tickets', data),
  update:     (id, data) => api.put(`/tickets/${id}`, data),
  delete:     (id)       => api.delete(`/tickets/${id}`),
  addComment: (id, data) => api.post(`/tickets/${id}/comments`, data),
};
