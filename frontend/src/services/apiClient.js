import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 180000,
});

// Request interceptor to attach JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for unified response unwrapping and auth refresh
apiClient.interceptors.response.use(
  (response) => {
    // Backend wraps success in { data, message, code }
    if (response.data && response.data.data !== undefined) {
      return response.data;
    }
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Auto-refresh token if 401 and we have a refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const res = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, {
            headers: { Authorization: `Bearer ${refreshToken}` },
          });
          const newAccess = res.data?.data?.access_token || res.data?.access_token;
          if (newAccess) {
            localStorage.setItem('access_token', newAccess);
            originalRequest.headers.Authorization = `Bearer ${newAccess}`;
            return apiClient(originalRequest);
          }
        } catch (refreshErr) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          window.dispatchEvent(new CustomEvent('auth:expired'));
        }
      }
    }

    const message = error.response?.data?.error || error.response?.data?.message || error.message || 'Request failed';
    return Promise.reject(new Error(message));
  }
);

export default apiClient;
