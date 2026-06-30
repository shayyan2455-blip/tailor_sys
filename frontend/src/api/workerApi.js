import api from './axiosClient';

export const workerApi = {
  list: () => api.get('/workers'),
  get: (id) => api.get(`/workers/${id}`),
  create: (payload) => api.post('/workers', payload),
  update: (id, payload) => api.put(`/workers/${id}`, payload),
  remove: (id) => api.delete(`/workers/${id}`)
};
