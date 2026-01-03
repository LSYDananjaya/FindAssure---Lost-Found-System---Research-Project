import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';
import type { FoundItem } from '../types';

export const getFoundItemsByIds = async (itemIds: string[]): Promise<FoundItem[]> => {
  try {
    const response = await axios.post(API_ENDPOINTS.GET_FOUND_ITEMS_BATCH, { itemIds });
    return response.data;
  } catch (error) {
    console.error('Error fetching found items:', error);
    throw error;
  }
};
