import api from './axiosClient';

export const reportApi = {
  pendingOrders: (params) => api.get('/reports/pending-orders', { params }),
  readyOrders: (params) => api.get('/reports/ready-orders', { params }),
  deliveredOrders: (params) => api.get('/reports/delivered-orders', { params }),
  recovery: (params) => api.get('/reports/recovery', { params }),
  workerLedger: (params) => api.get('/reports/worker-ledger', { params }),
  profit: (params) => api.get('/reports/profit', { params })
};
