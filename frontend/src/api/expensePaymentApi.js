import api from './axiosClient';

export const expensePaymentApi = {
  list: (expenseId) => api.get(`/expense-payments/${expenseId}/payments`),
  create: (expenseId, data) => api.post(`/expense-payments/${expenseId}/payments`, data),
  update: (expenseId, id, data) => api.put(`/expense-payments/${expenseId}/payments/${id}`, data),
  remove: (expenseId, id) => api.delete(`/expense-payments/${expenseId}/payments/${id}`)
};
