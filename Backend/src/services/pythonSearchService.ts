import axios from 'axios';

const PYTHON_SEMANTIC_BACKEND_URL =
  process.env.PYTHON_SEMANTIC_BACKEND_URL ||
  process.env.PYTHON_BACKEND_URL ||
  'http://127.0.0.1:8001';

// Search query sent from Node to the semantic Python search backend.
export interface PythonSearchRequest {
  text: string;
  category?: string;
  limit?: number;
  session_id?: string;
}

// One matched found item returned by the Python semantic search service.
export interface PythonSearchMatch {
  id: string;
  description: string;
  category: string;
  score: number;
  reason: string;
}

// Full search response used by the owner search screens and backend services.
export interface PythonSearchResponse {
  matches: PythonSearchMatch[];
  total_matches: number;
  inferred_context?: string[];
  query_id?: string;
  impression_id?: string;
  grammar_corrected?: boolean;
  corrected_text?: string | null;
}

/**
 * Call the Python semantic search service with the owner's lost-item text.
 * Returns ranked candidate found items and any query correction/context metadata.
 */
export const searchLostItemWithPython = async (
  payload: PythonSearchRequest
): Promise<PythonSearchResponse> => {
  try {
    const response = await axios.post<PythonSearchResponse>(
      `${PYTHON_SEMANTIC_BACKEND_URL}/search`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 20000,
      }
    );

    return response.data;
  } catch (error: any) {
    if (error.response) {
      throw new Error(
        `Python search failed: ${error.response.data?.detail || error.response.statusText}`
      );
    }
    if (error.request) {
      throw new Error(
        'Python search service is not responding. Please ensure the semantic Python backend is running.'
      );
    }
    throw new Error(`Python search request failed: ${error.message}`);
  }
};
