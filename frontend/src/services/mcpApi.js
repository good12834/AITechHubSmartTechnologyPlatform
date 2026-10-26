// MCP client for React frontend
// Provides functions to list available MCP tools and invoke a tool.

import apiClient from './apiClient';

/**
 * Fetch the list of MCP tools from the backend.
 * Returns an array of tool descriptors as defined by the Flask blueprint.
 */
export const fetchMcpTools = async () => {
  const res = await apiClient.get('/mcp/tools');
  // The backend wraps the list in { tools: [...] }
  return res.data?.tools || [];
};

/**
 * Call an MCP tool.
 * @param {string} name - Name of the tool (e.g., "search_projects").
 * @param {object} args - Arguments object matching the tool schema.
 * @returns {Promise<any>} Result payload from the server.
 */
export const callMcpTool = async (name, args = {}) => {
  const payload = { name, arguments: args };
  const res = await apiClient.post('/mcp/call', payload);
  // Backend returns { result: ... }
  return res.data?.result;
};

export default { fetchMcpTools, callMcpTool };
