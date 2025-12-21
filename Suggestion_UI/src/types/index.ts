// Types for the location similarity system

export interface SimilarItem {
  itemId: string;
  similarityScore: number;
  location: string;
}

export interface SimilarityInput {
  ownerId: string;
  ownerLocation: string;
  items: SimilarItem[];
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
