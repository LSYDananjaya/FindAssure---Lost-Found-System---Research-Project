import axios from 'axios';
import type {
  FoundItemInput,
  FoundItem,
  VerificationInput,
  Verification,
} from '../types';

// Re-export types for convenience
export type { FoundItemInput, FoundItem, VerificationInput, Verification };

// API Base URL - update this to match your backend URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============================================
// API FUNCTIONS
// ============================================

/**
 * Generate verification questions using AI
 */
export const generateQuestions = async (category: string, description: string): Promise<string[]> => {
  const response = await apiClient.post('/items/generate-questions', {
    category,
    description,
  });
  return response.data.questions;
};

/**
 * Create a found item report
 */
export const createFoundItem = async (data: FoundItemInput): Promise<FoundItem> => {
  const response = await apiClient.post('/items/found', data);
  return response.data;
};

/**
 * Get all found items
 */
export const getFoundItems = async (filters?: { category?: string; status?: string }): Promise<FoundItem[]> => {
  const params = new URLSearchParams();
  if (filters?.category) params.append('category', filters.category);
  if (filters?.status) params.append('status', filters.status);
  
  const response = await apiClient.get('/items/found', { params });
  return response.data;
};

/**
 * Get a single found item by ID
 */
export const getFoundItemById = async (id: string): Promise<FoundItem> => {
  const response = await apiClient.get(`/items/found/${id}`);
  return response.data;
};

/**
 * Create a verification request
 */
export const createVerification = async (data: VerificationInput): Promise<Verification> => {
  const response = await apiClient.post('/items/verification', data);
  return response.data;
};

export default apiClient;
