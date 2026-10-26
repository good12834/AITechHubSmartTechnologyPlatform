import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../services/apiClient';

const WorkspaceContext = createContext(null);

export function WorkspaceProvider({ children }) {
  const [selectedModel, setSelectedModel] = useState(() => {
    return localStorage.getItem('preferred_model') || 'gemma4:e4b';
  });
  const [activeProject, setActiveProject] = useState(null);
  const [isAiOnline, setIsAiOnline] = useState(true);
  const [availableModels, setAvailableModels] = useState([
    { name: 'gemma4:e4b', family: 'gemma4', capabilities: ['chat', 'code'] },
    { name: 'gemma4:12b', family: 'gemma4', capabilities: ['chat', 'code'] },
    { name: 'gemma4e-64k:latest', family: 'gemma4', capabilities: ['chat', 'code'] },
    { name: 'deepseek-v4.1-flash:cloud', family: 'deepseek', capabilities: ['chat', 'code'] },
  ]);

  useEffect(() => {
    localStorage.setItem('preferred_model', selectedModel);
  }, [selectedModel]);

  // Check health and available models
  useEffect(() => {
    async function checkHealth() {
      try {
        const res = await apiClient.get('/admin/ai/models').catch(() => null);
        if (res?.data?.models && res.data.models.length > 0) {
          setAvailableModels(res.data.models);
          setIsAiOnline(res.data.provider_available ?? true);
        }
      } catch (e) {
        // Fallback models remain active
      }
    }
    checkHealth();
  }, []);

  const value = {
    selectedModel,
    setSelectedModel,
    activeProject,
    setActiveProject,
    isAiOnline,
    availableModels,
  };

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}
