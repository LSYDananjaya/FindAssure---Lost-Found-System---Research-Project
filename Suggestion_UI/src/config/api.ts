const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

export const API_ENDPOINTS = {
  // Items
  GET_FOUND_ITEMS: `${API_BASE_URL}/items/found`,
  GET_FOUND_ITEMS_BATCH: `${API_BASE_URL}/items/found/batch`,
  
  // Users
  GET_ALL_USERS: `${API_BASE_URL}/items/users`,
  
  // Suggestion System
  FIND_ITEMS: 'http://127.0.0.1:5001/api/find-items',
};

export default API_BASE_URL;
