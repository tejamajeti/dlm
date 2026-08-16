import axios from 'axios';

// Base URL falls back to local proxy or environment variable for standalone deployment
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach Authorization Bearer token to protected calls
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('dlm_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const errorMsg = error.response?.data?.message || error.message || 'API request failed';
    return Promise.reject(new Error(errorMsg));
  }
);

export default api;
