import api from './axiosClient';

export const orderApi = {
  list: (params) => api.get('/orders', { params }),
  deliveryList: () => api.get('/orders/delivery'),
  detail: (id) => api.get(`/orders/${id}`),
  create: (payload) => api.post('/orders/new', payload),
  update: (id, payload) => api.put(`/orders/${id}`, payload)
};
