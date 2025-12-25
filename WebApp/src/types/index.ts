// Type definitions for the FindAssure API

export interface LocationDetail {
  location: string;
  floor_id?: string | null;
  hall_name?: string | null;
}

export interface FoundItemInput {
  imageUrl: string;
  category: string;
  description: string;
  questions: string[];
  founderAnswers: string[];
  found_location: LocationDetail[];
  founderContact: {
    name: string;
    email: string;
    phone: string;
  };
}

export interface FoundItem {
  _id: string;
  imageUrl: string;
  category: string;
  description: string;
  questions: string[];
  found_location: LocationDetail[];
  status: 'available' | 'pending_verification' | 'claimed';
  founderContact: {
    name: string;
    email: string;
    phone: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface OwnerAnswerInput {
  questionId: number;
  answer: string;
  videoKey?: string;
}

export interface VerificationInput {
  foundItemId: string;
  ownerAnswers: OwnerAnswerInput[];
}

export interface Verification {
  _id: string;
  foundItemId: string;
  ownerId: string;
  answers: Array<{
    questionId: number;
    question: string;
    founderAnswer: string;
    ownerAnswer: string;
    videoKey: string;
  }>;
  status: 'pending' | 'passed' | 'failed';
  similarityScore: number | null;
  createdAt: string;
  updatedAt: string;
}
