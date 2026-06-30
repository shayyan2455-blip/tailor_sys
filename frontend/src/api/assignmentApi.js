import api from './axiosClient';

export const assignmentApi = {
  list: (params) => api.get('/assignments', { params }),
  create: (payload) => api.post('/assignments', payload),
  remove: (id) => api.delete(`/assignments/${id}`)
};
