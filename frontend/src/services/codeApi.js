import apiClient from './apiClient';

export const codeApi = {
  generateCode: async ({ prompt, language, model }) => {
    const res = await apiClient.post('/code-studio/generate', {
      prompt,
      language,
      model,
    });
    return res.data?.generation;
  },

  explainCode: async ({ code, language, model }) => {
    const res = await apiClient.post('/code-studio/explain', {
      code,
      language,
      model,
    });
    return res.data?.generation;
  },

  improveCode: async ({ code, instructions, language, model }) => {
    const res = await apiClient.post('/code-studio/improve', {
      code,
      instructions,
      language,
      model,
    });
    return res.data?.generation;
  },
};

export default codeApi;
