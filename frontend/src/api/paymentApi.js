import api from './axiosClient';

export const paymentApi = {
  list: (params) => api.get('/payments', { params }),
  create: (payload) => api.post('/payments', payload)
};
