import axios from 'axios';
import FormData from 'form-data';
import { Readable } from 'stream';

// Flask services used by the ownership verification workflow.
const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || 'http://127.0.0.1:5000';
const PYTHON_SUSPICION_BACKEND_URL =
  process.env.PYTHON_SUSPICION_BACKEND_URL || 'http://127.0.0.1:5005';

// One expected answer/question record sent to the Python verification service.
export interface PythonVerificationAnswer {
  question_id: number;
  video_key: string;
  founder_answer: string;
  owner_answer: string;
  question_text?: string;
  question_type?: string;
  question_level?: string;
  question_weight?: number;
}

// Full JSON payload attached to the multipart request under the "data" field.
export interface PythonVerificationRequest {
  owner_id: string;
  category: string;
  answers: PythonVerificationAnswer[];
}

// Multer file data kept in memory by the Node controller before forwarding.
export interface VideoFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
}

// Per-question result returned by Python after transcription and scoring.
export interface PythonVerificationResult {
  question_id: number;
  question_type?: string;
  question_weight?: number;
  local_score: string;
  gemini_score: string | null;
  final_similarity: string;
  status: 'match' | 'partial_match' | 'mismatch';
  owner_transcript: string;
  founder_answer: string;
  gemini_analysis: string | null;
  audio_confidence?: {
    score?: string;
    label?: string;
    guessing_risk_score?: string;
    guessing_label?: string;
    diagnostics?: Record<string, any>;
  };
}

// Overall Python response used to update the verification and item status.
export interface PythonVerificationResponse {
  owner_id: string;
  category: string;
  final_confidence?: string;
  is_absolute_owner?: boolean;
  gemini_recommendation?: string;
  gemini_reasoning?: string;
  rejection_reason?: string;
  minimum_question_score?: string;
  semantic_confidence?: string;
  face_confidence_score?: string;
  avg_audio_confidence?: string;
  avg_guessing_risk?: string;
  guessing_penalty?: string;
  face_decision?: string;
  has_zero_match_question?: boolean;
  results?: PythonVerificationResult[];
}

/**
 * Build multipart form-data and call the Python ownership verification service.
 * The JSON metadata is sent in "data"; each video file is sent using its video_key.
 */
export const verifyOwnershipWithPython = async (
  data: PythonVerificationRequest,
  videoFiles: Map<string, VideoFile>
): Promise<PythonVerificationResponse> => {
  try {
    // Rebuild form-data when calling multiple Python endpoints because streams are single-use.
    const buildFormData = (): FormData => {
      const formData = new FormData();

      // Add JSON data as a string in the 'data' field
      formData.append('data', JSON.stringify(data));

      // Add video files with their corresponding keys
      for (const [videoKey, file] of videoFiles.entries()) {
        const stream = Readable.from(file.buffer);
        formData.append(videoKey, stream, {
          filename: file.originalname,
          contentType: file.mimetype,
        });
      }

      return formData;
    };

    // Build separate payloads because multipart streams are single-use.
    const verifyFormData = buildFormData();
    const suspicionFormData = buildFormData();

    // trigger suspicion analysis in parallel and do not block owner verification.
    void axios
      .post(
        `${PYTHON_SUSPICION_BACKEND_URL}/analyze-suspicion`,
        suspicionFormData,
        {
          headers: {
            ...suspicionFormData.getHeaders(),
          },
          timeout: 120000,
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
        }
      )
      .catch((suspicionError: any) => {
        console.error(
          'Error calling suspicion analysis service:',
          suspicionError?.response?.data || suspicionError?.message || suspicionError
        );
      });

    const response = await axios.post<PythonVerificationResponse>(
      `${PYTHON_BACKEND_URL}/verify-owner`,
      verifyFormData,
      {
        headers: {
          ...verifyFormData.getHeaders(),
        },
        timeout: 120000, // 120 seconds timeout for video processing and AI analysis
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
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
