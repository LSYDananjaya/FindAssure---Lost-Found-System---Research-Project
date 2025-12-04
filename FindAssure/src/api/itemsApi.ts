import axiosClient from './axiosClient';
import { FoundItem, LostItem, OwnerAnswerInput, AdminOverview } from '../types/models';

export const itemsApi = {
  // IMAGE UPLOAD
  
  // Upload image to server (Cloudinary)
  uploadImage: async (imageUri: string): Promise<string> => {
    const formData = new FormData();
    
    // Get file info
    const filename = imageUri.split('/').pop() || 'image.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    // Append image to form data
    formData.append('image', {
      uri: imageUri,
      name: filename,
      type: type,
    } as any);

    // Upload to backend
    const response = await axiosClient.post<{ imageUrl: string; publicId: string }>(
      '/upload/image',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data.imageUrl;
  },

  // AI QUESTION GENERATION
  
  // Generate verification questions using AI
  generateQuestions: async (data: {
    category: string;
    description: string;
  }): Promise<{ questions: string[] }> => {
    const response = await axiosClient.post<{ questions: string[] }>('/items/generate-questions', data);
    return response.data;
  },

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

  // Submit verification (owner's answers with unified structure)
  submitVerification: async (data: {
    foundItemId: string;
    ownerAnswers: OwnerAnswerInput[];
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
