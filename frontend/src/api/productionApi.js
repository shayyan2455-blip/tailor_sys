import api from './axiosClient';

export const productionApi = {
  active: () => api.get('/production/active'),
  toggleStage: (payload) => api.patch('/production/stage', payload)
};
