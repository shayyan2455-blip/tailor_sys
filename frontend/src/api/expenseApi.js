import api from './axiosClient';

export const expenseApi = {
  list: (params) => api.get('/expenses', { params }),
  create: (payload) => api.post('/expenses', payload),
  update: (id, payload) => api.put(`/expenses/${id}`, payload),
  remove: (id) => api.delete(`/expenses/${id}`)
};
