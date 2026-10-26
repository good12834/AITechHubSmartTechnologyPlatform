import apiClient from './apiClient';

export const documentsApi = {
  uploadDocument: async (file, projectId = null) => {
    const formData = new FormData();
    formData.append('file', file);
    if (projectId) {
      formData.append('project_id', projectId);
    }
    const res = await apiClient.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data?.document;
  },

  listDocuments: async (params = {}) => {
    const res = await apiClient.get('/documents', { params });
    return res.data;
  },

  getDocument: async (id) => {
    const res = await apiClient.get(`/documents/${id}`);
    return res.data?.document;
  },

  deleteDocument: async (id) => {
    const res = await apiClient.delete(`/documents/${id}`);
    return res;
  },

  searchChunks: async (query, documentIds = null, topK = 5) => {
    const res = await apiClient.post('/documents/search', {
      query,
      document_ids: documentIds,
      top_k: topK,
    });
    return res.data?.results || [];
  },

  askDocument: async (documentId, question, model = null) => {
    const res = await apiClient.post(`/documents/${documentId}/ask`, {
      question,
      model,
    });
    return res.data;
  },

  processDocument: async (documentId) => {
    const res = await apiClient.post(`/documents/${documentId}/process`);
    return res.data?.document;
  },
};

export default documentsApi;
