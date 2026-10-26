import apiClient from './apiClient';

export const chatApi = {
  listConversations: async (includeArchived = false) => {
    const res = await apiClient.get('/chat/conversations', {
      params: { include_archived: includeArchived },
    });
    return res.data?.conversations || [];
  },

  createConversation: async (data = {}) => {
    const res = await apiClient.post('/chat/conversations', data);
    return res.data?.conversation;
  },

  getConversation: async (id) => {
    const res = await apiClient.get(`/chat/conversations/${id}`);
    return res.data?.conversation;
  },

  updateConversation: async (id, data) => {
    const res = await apiClient.patch(`/chat/conversations/${id}`, data);
    return res.data?.conversation;
  },

  deleteConversation: async (id) => {
    const res = await apiClient.delete(`/chat/conversations/${id}`);
    return res;
  },

  sendMessageSync: async (id, { content, model }) => {
    const res = await apiClient.post(`/chat/conversations/${id}/messages`, {
      content,
      model,
      stream: false,
    });
    return res.data;
  },
};

export default chatApi;
