// Types for the location similarity system

export interface FoundLocation {
  location: string;
  floor_id: number | null;
  hall_name: string | null;
}

export interface CategoryItem {
  id: string | number; // Support both MongoDB ObjectId (string) and numeric IDs
  description_scrore: number;
  found_location: FoundLocation[];
}

export interface SimilarItem {
  itemId: string;
  similarityScore: number;
  location: string;
  floorId?: number | null;
  hallName?: string | null;
}

export interface SimilarityInput {
  ownerId: string;
  categoryName: string;
  descriptionMatchConfidence: number;
  ownerLocation: string;
  ownerFloorId?: number | null;
  ownerHallName?: string | null;
  ownerLocationConfidenceStage: number;
  items: SimilarItem[];
}

// Python Backend API Types
export interface PythonBackendRequest {
  owner_id: string | number; // Support both MongoDB ObjectId (string) and numeric IDs
  categary_name: string;
  categary_data: CategoryItem[];
  description_match_cofidence: number;
  owner_location: string;
  floor_id: number | null;
  hall_name: string | null;
  owner_location_confidence_stage: number;
}

export interface PythonBackendResponse {
  location_match: boolean;
  matched_item_ids: (string | number)[]; // Support both ID formats
  matched_locations: string[];
  success: boolean;
}

export interface FoundItem {
  _id: string;
  itemName: string;
  category: string;
  description: string;
  location: string;
  foundDate: string;
  imageUrl?: string;
  status: string;
  contactInfo?: string;
}
