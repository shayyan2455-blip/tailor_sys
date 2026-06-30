import api from './axiosClient';

export const utilityApi = {
  settings: () => api.get('/utility/settings'),
  updateSettings: (payload) => api.put('/utility/settings', payload),
  backup: () => api.post('/utility/backup')
};
