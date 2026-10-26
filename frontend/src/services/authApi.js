import apiClient from './apiClient';

export const authApi = {
  login: async (credentials) => {
    const res = await apiClient.post('/auth/login', credentials);
    return res.data;
  },

  register: async (userData) => {
    const res = await apiClient.post('/auth/register', userData);
    return res.data;
  },

  logout: async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (e) {
      // ignore logout network errors
    }
  },

  getMe: async () => {
    const res = await apiClient.get('/auth/me');
    return res.data?.user;
  },

  forgotPassword: async (email) => {
    const res = await apiClient.post('/auth/forgot-password', { email });
    return res;
  },

  resetPassword: async (data) => {
    const res = await apiClient.post('/auth/reset-password', data);
    return res;
  },

  updateProfile: async (data) => {
    const res = await apiClient.patch('/users/profile', data);
    return res.data?.user;
  },

  changePassword: async (passwords) => {
    const res = await apiClient.put('/users/password', passwords);
    return res;
  },
};

export default authApi;
