import apiClient from './apiClient';

export const projectsApi = {
  listProjects: async (params = {}) => {
    const res = await apiClient.get('/projects', { params });
    return res.data;
  },

  createProject: async (data) => {
    const res = await apiClient.post('/projects', data);
    return res.data?.project;
  },

  getProject: async (id) => {
    const res = await apiClient.get(`/projects/${id}`);
    return res.data?.project;
  },

  updateProject: async (id, data) => {
    const res = await apiClient.patch(`/projects/${id}`, data);
    return res.data?.project;
  },

  deleteProject: async (id) => {
    const res = await apiClient.delete(`/projects/${id}`);
    return res;
  },
};

export default projectsApi;
