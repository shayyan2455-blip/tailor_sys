import api from './axiosClient';

export const customerMeasurementApi = {
  getByCustomer: (customerId) => api.get(`/customer-measurements/customer/${customerId}`),
  upsert: (payload) => api.post('/customer-measurements', payload)
};
