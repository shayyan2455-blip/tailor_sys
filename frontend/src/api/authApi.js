import api from './axiosClient';

export const authApi = {
  login: (payload) => api.post('/auth/login', payload),
  logout: () => api.post('/auth/logout'),
  session: () => api.get('/auth/session'),
  changePassword: (payload) => api.post('/auth/change-password', payload),
  createWorkerUser: (payload) => api.post('/auth/create-worker-user', payload),
  createUser: (payload) => api.post('/auth/create-user', payload),
  listUsers: () => api.get('/auth/users'),
  forgotPassword: (payload) => api.post('/auth/forgot-password', payload),
  verifyOTP: (payload) => api.post('/auth/verify-otp', payload),
  resetPassword: (payload) => api.post('/auth/reset-password', payload)
};
