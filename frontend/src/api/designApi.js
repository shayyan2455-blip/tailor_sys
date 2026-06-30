import api from './axiosClient';

export const designApi = {
  list: () => api.get('/designs'),
  create: (payload) => api.post('/designs', payload),
  update: (id, payload) => api.put(`/designs/${id}`, payload),
  remove: (id) => api.delete(`/designs/${id}`)
};
