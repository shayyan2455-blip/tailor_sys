import api from './axiosClient';

export const authApi = {
  login: (payload) => api.post('/auth/login', payload),
  logout: () => api.post('/auth/logout'),
  session: () => api.get('/auth/session'),
  changePassword: (payload) => api.post('/auth/change-password', payload)
};
