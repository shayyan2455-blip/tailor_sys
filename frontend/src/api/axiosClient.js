import axios from 'axios';

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

let onUnauthorized = null;

export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && onUnauthorized) {
      onUnauthorized();
    }
    return Promise.reject(error.response?.data || { error: { message: error.message } });
  }
);

export default axiosClient;
