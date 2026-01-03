// Types for the location similarity system

export interface LocationDetail {
  location: string;
  floor_id?: string | null;
  hall_name?: string | null;
}

export interface SimilarItem {
  itemId: string;
  similarityScore: number; // Description score 0-100
}

export interface SimilarityInput {
  ownerId: string;
  owner_location: string;
  floor_id?: string | null;
  hall_name?: string | null;
  owner_location_confidence_stage: number; // 1-4 (Python backend supports 1-4)
  items: SimilarItem[];
}

export interface FoundItem {
  _id: string;
  category: string;
  description: string;
  imageUrl: string;
  found_location: LocationDetail[];
  status: 'available' | 'pending_verification' | 'claimed';
  questions: string[];
  founderContact?: {
    name: string;
    email: string;
    phone: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface User {
  _id: string;
  uid: string;
  email: string;
  name?: string;
  phone?: string;
  role: 'owner' | 'founder' | 'admin';
  createdAt: string;
}
