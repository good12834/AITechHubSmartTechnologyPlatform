import apiClient from './apiClient';

export const imageApi = {
  generateImage: async ({ prompt, model, style, aspectRatio, seed, negativePrompt }) => {
    const res = await apiClient.post('/image-studio/generate', {
      prompt,
      model,
      style,
      aspect_ratio: aspectRatio,
      seed,
      negative_prompt: negativePrompt,
    });
    return res.data?.generation || res.generation || res;
  },

  listGenerations: async (params = {}) => {
    const res = await apiClient.get('/image-studio/generations', { params });
    return res.data || res;
  },

  getGeneration: async (id) => {
    const res = await apiClient.get(`/image-studio/generations/${id}`);
    return res.data?.generation || res.generation || res;
  },

  deleteGeneration: async (id) => {
    const res = await apiClient.delete(`/image-studio/generations/${id}`);
    return res.data || res;
  },
};

export default imageApi;
