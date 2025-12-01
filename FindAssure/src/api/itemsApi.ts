import axiosClient from './axiosClient';
import { FoundItem, LostItem, VideoAnswer, AdminOverview } from '../types/models';

export const itemsApi = {
  // FOUNDER ENDPOINTS
  
  // Report a found item
  reportFoundItem: async (data: {
    imageUrl: string;
    category: string;
    description: string;
    questions: string[];
    founderAnswers: string[];
    location: string;
    founderContact: {
      name: string;
      email: string;
      phone: string;
    };
  }): Promise<FoundItem> => {
    const response = await axiosClient.post<FoundItem>('/items/found', data);
    return response.data;
  },

  // OWNER ENDPOINTS
  
  // Create a lost item request
  reportLostItem: async (data: {
    category: string;
    description: string;
    location: string;
    confidenceLevel: number;
  }): Promise<LostItem> => {
    const response = await axiosClient.post<LostItem>('/items/lost', data);
    return response.data;
  },

  // Get all found items (for owner to browse)
  getFoundItems: async (): Promise<FoundItem[]> => {
    const response = await axiosClient.get<FoundItem[]>('/items/found');
    return response.data;
  },

  // Get a specific found item by ID
  getFoundItemById: async (id: string): Promise<FoundItem> => {
    const response = await axiosClient.get<FoundItem>(`/items/found/${id}`);
    return response.data;
  },

  // Submit verification (owner's video answers)
  submitVerification: async (data: {
    foundItemId: string;
    ownerVideoAnswers: VideoAnswer[];
  }): Promise<any> => {
    const response = await axiosClient.post('/items/verification', data);
    return response.data;
  },

  // ADMIN ENDPOINTS
  
  // Get admin overview statistics
  getAdminOverview: async (): Promise<AdminOverview> => {
    const response = await axiosClient.get<AdminOverview>('/admin/overview');
    return response.data;
  },

  // Update found item status (admin only)
  updateFoundItemStatus: async (id: string, status: string): Promise<FoundItem> => {
    const response = await axiosClient.patch<FoundItem>(`/admin/items/found/${id}`, { status });
    return response.data;
  },
};
