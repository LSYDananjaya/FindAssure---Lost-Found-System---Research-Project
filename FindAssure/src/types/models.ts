// TypeScript type definitions for Lost & Found System

export interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: 'owner' | 'admin'; // Only owners and admins register
  createdAt: string;
  updatedAt?: string;
}

export interface FounderContact {
  name: string;
  email: string;
  phone: string;
}

export interface FoundItem {
  _id: string;
  imageUrl: string;
  category: string;
  description: string;
  questions: string[];        // Questions chosen by founder (5 questions)
  founderAnswers: string[];   // Founder's text answers - DO NOT SHOW to owner in UI
  founderContact: FounderContact;
  location: string;           // Where item was found - MUST be stored
  status: 'available' | 'pending_verification' | 'claimed';
  createdAt: string;
  updatedAt?: string;
}

export interface LostItem {
  _id: string;
  userId: string;
  category: string;
  description: string;
  location: string;
  confidenceLevel: number;
  status: 'searching' | 'found' | 'closed';
  createdAt: string;
  updatedAt?: string;
}

export interface VideoAnswer {
  question: string;
  videoUrl: string;
}

export interface VerificationRequest {
  _id: string;
  foundItemId: string;
  ownerId: string;
  ownerVideoAnswers: VideoAnswer[];
  status: 'pending' | 'passed' | 'failed';
  createdAt: string;
  updatedAt?: string;
}

export interface AdminOverview {
  totalUsers: number;
  totalFoundItems: number;
  totalLostRequests: number;
  pendingVerifications: number;
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  phone: string;
  password: string;
  // Role is always 'owner' for new registrations
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Navigation types
export type RootStackParamList = {
  Home: undefined;
  Login: undefined;
  Register: undefined;
  Profile: undefined;
  
  // Founder Flow
  ReportFoundStart: undefined;
  ReportFoundDetails: { imageUri: string };
  ReportFoundQuestions: { imageUri: string; category: string; description: string };
  ReportFoundAnswers: { imageUri: string; category: string; description: string; selectedQuestions: string[] };
  ReportFoundLocation: { 
    imageUri: string; 
    category: string; 
    description: string; 
    selectedQuestions: string[]; 
    founderAnswers: string[] 
  };
  ReportFoundSuccess: undefined;
  
  // Owner Flow
  FindLostStart: undefined;
  FindLostResults: { foundItems: FoundItem[] };
  ItemDetail: { foundItem: FoundItem };
  AnswerQuestionsVideo: { foundItem: FoundItem };
  VerificationPending: undefined;
  
  // Admin Flow
  AdminLogin: undefined;
  AdminDashboard: undefined;
  AdminItemDetail: { foundItem: FoundItem };
};
