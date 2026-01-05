import axiosClient from './axiosClient';
import { LoginCredentials, RegisterData, AuthResponse, User } from '../types/models';

export const authApi = {
  // Register new user
  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await axiosClient.post<AuthResponse>('/auth/register', data);
    return response.data;
  },

  // Login user
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await axiosClient.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },

  // Get current user profile
  getProfile: async (): Promise<User> => {
    const response = await axiosClient.get<User>('/auth/me');
    return response.data;
  },

  // Update user profile
  updateProfile: async (data: Partial<User>): Promise<User> => {
    const response = await axiosClient.patch<User>('/auth/me', data);
    return response.data;
  },

  // Get claimed items
  getClaimedItems: async (): Promise<any[]> => {
    const response = await axiosClient.get<any[]>('/auth/claimed-items');
    return response.data;
  },
};
