// Type definitions for the FindAssure API

export interface FoundItemInput {
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
}

export interface FoundItem {
  _id: string;
  imageUrl: string;
  category: string;
  description: string;
  questions: string[];
  location: string;
  status: 'available' | 'pending_verification' | 'claimed';
  founderContact: {
    name: string;
    email: string;
    phone: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface VerificationInput {
  foundItemId: string;
  ownerAnswers: string[];
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
