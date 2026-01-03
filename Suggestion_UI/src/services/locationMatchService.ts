import axios from 'axios';
import type { PythonBackendRequest, PythonBackendResponse, SimilarityInput } from '../types';

const PYTHON_API_URL = 'http://127.0.0.1:5001/api/find-items';

export const findMatchingItems = async (input: SimilarityInput): Promise<PythonBackendResponse> => {
  try {
    // Transform the input data to match Python backend format
    const requestData: PythonBackendRequest = {
      owner_id: input.ownerId, // Keep as string for MongoDB ObjectId support
      categary_name: input.categoryName,
      categary_data: input.items.map(item => ({
        id: item.itemId, // Keep as string for MongoDB ObjectId support
        description_scrore: Math.round(item.similarityScore), // Already 0-100
        found_location: [{
          location: item.location,
          floor_id: item.floorId ?? null,
          hall_name: item.hallName ?? null,
        }],
      })),
      description_match_cofidence: input.descriptionMatchConfidence,
      owner_location: input.ownerLocation,
      floor_id: input.ownerFloorId ?? null,
      hall_name: input.ownerHallName ?? null,
      owner_location_confidence_stage: input.ownerLocationConfidenceStage,
    };

    console.log('Sending request to Python backend:', requestData);

    const response = await axios.post<PythonBackendResponse>(PYTHON_API_URL, requestData, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 seconds timeout
    });

    console.log('Python backend response:', response.data);

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Python backend API error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw new Error(
        error.response?.data?.message || 
        'Failed to connect to location matching service. Please ensure the Python backend is running on http://127.0.0.1:5000'
      );
    }
    console.error('Unexpected error:', error);
    throw error;
  }
};
