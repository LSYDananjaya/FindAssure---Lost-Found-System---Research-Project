import axios from 'axios';

// Python backend URL
const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || 'http://127.0.0.1:5000';

export interface PythonVerificationAnswer {
  question_id: number;
  video_key: string;
  founder_answer: string;
  owner_answer: string;
  question_text?: string;
}

export interface PythonVerificationRequest {
  owner_id: string;
  category: string;
  answers: PythonVerificationAnswer[];
}

export interface PythonVerificationResult {
  question_id: number;
  local_nlp_score: string;
  gemini_score: string | null;
  final_similarity: string;
  status: 'match' | 'partial_match' | 'mismatch';
  local_explanation: string;
  gemini_analysis: string | null;
}

export interface PythonVerificationResponse {
  owner_id: string;
  category: string;
  average_local_score: string;
  average_gemini_score: string | null;
  final_confidence: string;
  is_absolute_owner: boolean;
  gemini_overall_score: string | null;
  gemini_recommendation: string;
  gemini_reasoning: string;
  results: PythonVerificationResult[];
}

/**
 * Call Python backend to verify ownership
 */
export const verifyOwnershipWithPython = async (
  data: PythonVerificationRequest
): Promise<PythonVerificationResponse> => {
  try {
    const response = await axios.post<PythonVerificationResponse>(
      `${PYTHON_BACKEND_URL}/verify-owner`,
      [data], // Python backend expects an array
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 60000, // 60 seconds timeout for AI processing
      }
    );

    return response.data;
  } catch (error: any) {
    console.error('Error calling Python verification service:', error);
    
    if (error.response) {
      // The request was made and the server responded with a status code
      throw new Error(
        `Python verification failed: ${error.response.data?.error || error.response.statusText}`
      );
    } else if (error.request) {
      // The request was made but no response was received
      throw new Error(
        'Python verification service is not responding. Please ensure the Python backend is running.'
      );
    } else {
      // Something happened in setting up the request
      throw new Error(`Verification request failed: ${error.message}`);
    }
  }
};
