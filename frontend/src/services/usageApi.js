import apiClient from './apiClient';

export const usageApi = {
  getSummary: async (days = 30) => {
    const res = await apiClient.get('/usage/summary', { params: { days } });
    return res.data;
  },

  getLimits: async () => {
    const res = await apiClient.get('/usage/limits');
    return res.data;
  },
};

export default usageApi;
