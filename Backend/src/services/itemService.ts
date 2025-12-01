import { Types } from 'mongoose';
import { FoundItem, IFoundItem, FoundItemStatus, IFounderContact } from '../models/FoundItem';
import { LostRequest, ILostRequest } from '../models/LostRequest';

export interface CreateFoundItemData {
  imageUrl: string;
  category: string;
  description: string;
  questions: string[];
  founderAnswers: string[];
  location: string;
  founderContact: IFounderContact;
  createdBy?: string;
}

export interface FoundItemFilters {
  category?: string;
  status?: FoundItemStatus;
}

export interface CreateLostRequestData {
  category: string;
  description: string;
  location: string;
  confidenceLevel: number;
}

/**
 * Create a new found item
 */
export const createFoundItem = async (data: CreateFoundItemData): Promise<IFoundItem> => {
  const foundItem = await FoundItem.create({
    imageUrl: data.imageUrl,
    category: data.category,
    description: data.description,
    questions: data.questions,
    founderAnswers: data.founderAnswers,
    location: data.location,
    founderContact: data.founderContact,
    status: 'available',
    ...(data.createdBy && { createdBy: new Types.ObjectId(data.createdBy) }),
  });

  return foundItem;
};

/**
 * List found items with optional filters
 */
export const listFoundItems = async (filters: FoundItemFilters = {}): Promise<IFoundItem[]> => {
  const query: any = {};

  if (filters.category) {
    query.category = filters.category;
  }

  if (filters.status) {
    query.status = filters.status;
  }

  const items = await FoundItem.find(query)
    .sort({ createdAt: -1 })
    .populate('createdBy', 'name email');

  return items;
};

/**
 * Get found item for owner view (without founderAnswers)
 */
export const getFoundItemForOwner = async (id: string): Promise<Partial<IFoundItem> | null> => {
  const item = await FoundItem.findById(id).populate('createdBy', 'name email');

  if (!item) {
    return null;
  }

  // Return item without founderAnswers
  const itemObj = item.toObject();
  const { founderAnswers, ...ownerView } = itemObj;

  return ownerView;
};

/**
 * Get found item for admin view (with all details)
 */
export const getFoundItemForAdmin = async (id: string): Promise<IFoundItem | null> => {
  const item = await FoundItem.findById(id).populate('createdBy', 'name email');
  return item;
};

/**
 * Update found item status
 */
export const updateFoundItemStatus = async (
  id: string,
  status: FoundItemStatus
): Promise<IFoundItem | null> => {
  const item = await FoundItem.findByIdAndUpdate(
    id,
    { status },
    { new: true, runValidators: true }
  );

  return item;
};

/**
 * Create a lost request
 */
export const createLostRequest = async (
  ownerId: string,
  data: CreateLostRequestData
): Promise<ILostRequest> => {
  const lostRequest = await LostRequest.create({
    ownerId: new Types.ObjectId(ownerId),
    category: data.category,
    description: data.description,
    location: data.location,
    confidenceLevel: data.confidenceLevel,
  });

  return lostRequest;
};

/**
 * Get lost requests by owner
 */
export const getLostRequestsByOwner = async (ownerId: string): Promise<ILostRequest[]> => {
  const requests = await LostRequest.find({ ownerId: new Types.ObjectId(ownerId) })
    .sort({ createdAt: -1 })
    .populate('matchedFoundItemIds');

  return requests;
};

/**
 * Get all found items for admin (with full details)
 */
export const getAllFoundItemsForAdmin = async (): Promise<IFoundItem[]> => {
  const items = await FoundItem.find()
    .sort({ createdAt: -1 })
    .populate('createdBy', 'name email role');

  return items;
};
