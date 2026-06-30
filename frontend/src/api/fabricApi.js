import api from './axiosClient';

export const fabricApi = {
  list: () => api.get('/fabrics'),
  create: (payload) => api.post('/fabrics', payload),
  update: (id, payload) => api.put(`/fabrics/${id}`, payload),
  remove: (id) => api.delete(`/fabrics/${id}`)
};
