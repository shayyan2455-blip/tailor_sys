import api from './axiosClient';

export const workerPaymentApi = {
  list: (params) => api.get('/worker-payments', { params }),
  balance: (params) => api.get('/worker-payments/balance', { params }),
  create: (payload) => api.post('/worker-payments', payload),
  remove: (id) => api.delete(`/worker-payments/${id}`)
};
