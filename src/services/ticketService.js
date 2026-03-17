import api from './api';

export const ticketService = {
  getAll: (params) => api.get('/tickets', { params }),
  getById: (id) => api.get(`/tickets/${id}`),
  create: (data) => api.post('/tickets', data),
  update: (id, data) => api.put(`/tickets/${id}`, data),
  delete: (id) => api.delete(`/tickets/${id}`),
  getStats: () => api.get('/tickets/stats'),
  addComment: (id, data) => api.post(`/tickets/${id}/comments`, data),
};
