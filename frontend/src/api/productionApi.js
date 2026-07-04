import api from './axiosClient';

export const productionApi = {
  active: () => api.get('/production/active'),
  toggleStage: (payload) => api.patch('/production/stage', payload),
  deliver: (payload) => api.post('/production/deliver', payload),
  tracking: (id) => api.get(`/production/tracking/${id}`)
};
