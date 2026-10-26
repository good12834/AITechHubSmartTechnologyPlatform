import apiClient from './apiClient';

export const workflowsApi = {
  listWorkflows: async (params = {}) => {
    const res = await apiClient.get('/workflows', { params });
    return res.data;
  },

  createWorkflow: async (data) => {
    const res = await apiClient.post('/workflows', data);
    return res.data?.workflow;
  },

  getWorkflow: async (id) => {
    const res = await apiClient.get(`/workflows/${id}`);
    return res.data?.workflow;
  },

  updateWorkflow: async (id, data) => {
    const res = await apiClient.patch(`/workflows/${id}`, data);
    return res.data?.workflow;
  },

  deleteWorkflow: async (id) => {
    const res = await apiClient.delete(`/workflows/${id}`);
    return res;
  },

  runWorkflow: async (id, input = {}) => {
    const res = await apiClient.post(`/workflows/${id}/run`, { input });
    return res.data?.run;
  },

  listRuns: async (id) => {
    const res = await apiClient.get(`/workflows/${id}/runs`);
    return res.data?.runs || [];
  },
};

export default workflowsApi;
