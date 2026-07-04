import api from './axiosClient';

export const customerPaymentApi = {
  list: (params) => api.get('/customer-payments', { params }),
  create: (payload) => api.post('/customer-payments', payload)
};
