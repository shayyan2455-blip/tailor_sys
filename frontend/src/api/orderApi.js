import api from './axiosClient';

export const orderApi = {
  list: (params) => api.get('/orders', { params }),
  detail: (id) => api.get(`/orders/${id}`),
  create: (payload) => api.post('/orders', payload),
  update: (id, payload) => api.put(`/orders/${id}`, payload)
};
