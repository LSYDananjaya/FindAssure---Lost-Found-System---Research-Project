import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';
import type { FoundItem, User } from '../types';

export const getFoundItems = async (): Promise<FoundItem[]> => {
  try {
    const response = await axios.get(API_ENDPOINTS.GET_FOUND_ITEMS);
    return response.data;
  } catch (error) {
    console.error('Error fetching found items:', error);
    throw error;
  }
};

export const getFoundItemsByIds = async (itemIds: string[]): Promise<FoundItem[]> => {
  try {
    const response = await axios.post(API_ENDPOINTS.GET_FOUND_ITEMS_BATCH, { itemIds });
    return response.data;
  } catch (error) {
    console.error('Error fetching found items:', error);
    throw error;
  }
};

export const getAllUsers = async (): Promise<User[]> => {
  try {
    const response = await axios.get(API_ENDPOINTS.GET_ALL_USERS);
    return response.data;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

export interface FindItemsRequest {
  owner_id: number;
  categary_name: string;
  categary_data: Array<{
    id: number;
    description_scrore: number;
    found_location: Array<{
      location: string;
      floor_id: number | null;
      hall_name: string | null;
    }>;
  }>;
  description_match_cofidence: number;
  owner_location: string;
  floor_id: number | null;
  hall_name: string | null;
  owner_location_confidence_stage: number;
}

export interface FindItemsResponse {
  location_match: boolean;
  matched_item_ids: number[];
  matched_locations: string[];
  success: boolean;
}

export const findItems = async (data: FindItemsRequest): Promise<FindItemsResponse> => {
  try {
    const response = await axios.post(API_ENDPOINTS.FIND_ITEMS, data);
    return response.data;
  } catch (error) {
    console.error('Error finding items:', error);
    throw error;
  }
};
