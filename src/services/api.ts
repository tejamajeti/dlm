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

let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response Interceptor with Automatic Silent Token Refresh on 401
api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;
    const isAuthRequest = originalRequest?.url?.includes('/public/auth/');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRequest) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('dlm_refresh_token');

      if (refreshToken) {
        try {
          // Call refresh endpoint directly using unintercepted axios instance
          const res = await axios.post(`${API_BASE_URL}/public/auth/refresh`, { refreshToken });
          if (res.data?.success && res.data?.data?.token) {
            const newAccessToken = res.data.data.token;
            localStorage.setItem('dlm_token', newAccessToken);
            api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            processQueue(null, newAccessToken);
            return api(originalRequest);
          }
        } catch (refreshErr) {
          processQueue(refreshErr, null);
          localStorage.removeItem('dlm_token');
          localStorage.removeItem('dlm_refresh_token');
          window.location.reload();
        } finally {
          isRefreshing = false;
        }
      }
    }

    const errorMsg = error.response?.data?.message || error.message || 'API request failed';
    return Promise.reject(new Error(errorMsg));
  }
);

export default api;
