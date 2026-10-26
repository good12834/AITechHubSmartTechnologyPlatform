import apiClient from './apiClient';

export const adminApi = {
  getOverview: async () => {
    const res = await apiClient.get('/admin/overview');
    return res.data;
  },

  listUsers: async (params = {}) => {
    const res = await apiClient.get('/admin/users', { params });
    return res.data;
  },

  updateUser: async (id, data) => {
    const res = await apiClient.patch(`/admin/users/${id}`, data);
    return res.data?.user;
  },

  deleteUser: async (id) => {
    const res = await apiClient.delete(`/admin/users/${id}`);
    return res;
  },

  getModels: async () => {
    const res = await apiClient.get('/admin/ai/models');
    return res.data;
  },

  getUsage: async () => {
    const res = await apiClient.get('/admin/usage');
    return res.data;
  },

  getJobs: async () => {
    const res = await apiClient.get('/admin/jobs');
    return res.data;
  },

  getAuditLogs: async () => {
    const res = await apiClient.get('/admin/audit-logs');
    return res.data;
  },
};

export default adminApi;
