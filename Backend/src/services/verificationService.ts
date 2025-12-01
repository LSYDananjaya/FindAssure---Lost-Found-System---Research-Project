import { Types } from 'mongoose';
import { Verification, IVerification, VerificationStatus, IOwnerVideoAnswer } from '../models/Verification';
import { FoundItem } from '../models/FoundItem';

export interface CreateVerificationData {
  foundItemId: string;
  ownerId: string;
  ownerVideoAnswers: IOwnerVideoAnswer[];
}

export interface EvaluateVerificationData {
  status: VerificationStatus;
  similarityScore?: number;
}

/**
 * Create a verification record
 */
export const createVerification = async (
  data: CreateVerificationData
): Promise<IVerification> => {
  // Fetch the found item to get questions and founder answers
  const foundItem = await FoundItem.findById(data.foundItemId);

  if (!foundItem) {
    throw new Error('Found item not found');
  }

  // Validate that owner provided answers for all questions
  if (data.ownerVideoAnswers.length !== foundItem.questions.length) {
    throw new Error('Owner must provide video answers for all questions');
  }

  // Create verification record
  const verification = await Verification.create({
    foundItemId: new Types.ObjectId(data.foundItemId),
    ownerId: new Types.ObjectId(data.ownerId),
    questions: foundItem.questions,
    founderAnswers: foundItem.founderAnswers,
    ownerVideoAnswers: data.ownerVideoAnswers,
    status: 'pending',
    similarityScore: null,
  });

  // Update found item status to pending_verification
  await FoundItem.findByIdAndUpdate(data.foundItemId, {
    status: 'pending_verification',
  });

  return verification;
};

/**
 * Get verification by ID
 * For owners: exclude founderAnswers
 * For admins: include all details
 */
export const getVerificationById = async (
  id: string,
  isAdmin: boolean = false
): Promise<Partial<IVerification> | null> => {
  const verification = await Verification.findById(id)
    .populate('foundItemId', 'category description imageUrl location')
    .populate('ownerId', 'name email phone');

  if (!verification) {
    return null;
  }

  if (isAdmin) {
    // Admin can see everything
    return verification;
  }

  // Owner view: exclude founderAnswers
  const verificationObj = verification.toObject();
  const { founderAnswers, ...ownerView } = verificationObj;

  return ownerView;
};

/**
 * Get verifications by owner ID
 */
export const getVerificationsByOwner = async (ownerId: string): Promise<IVerification[]> => {
  const verifications = await Verification.find({ ownerId: new Types.ObjectId(ownerId) })
    .sort({ createdAt: -1 })
    .populate('foundItemId', 'category description imageUrl location');

  return verifications;
};

/**
 * Get all verifications (admin only)
 */
export const getAllVerifications = async (): Promise<IVerification[]> => {
  const verifications = await Verification.find()
    .sort({ createdAt: -1 })
    .populate('foundItemId', 'category description imageUrl location')
    .populate('ownerId', 'name email phone');

  return verifications;
};

/**
 * Evaluate verification (for future AI implementation)
 */
export const evaluateVerification = async (
  id: string,
  data: EvaluateVerificationData
): Promise<IVerification | null> => {
  const verification = await Verification.findByIdAndUpdate(
    id,
    {
      status: data.status,
      ...(data.similarityScore !== undefined && { similarityScore: data.similarityScore }),
    },
    { new: true, runValidators: true }
  );

  if (!verification) {
    return null;
  }

  // If verification passed, update found item status to claimed
  if (data.status === 'passed') {
    await FoundItem.findByIdAndUpdate(verification.foundItemId, {
      status: 'claimed',
    });
  }

  return verification;
};

/**
 * Get pending verifications count
 */
export const getPendingVerificationsCount = async (): Promise<number> => {
  const count = await Verification.countDocuments({ status: 'pending' });
  return count;
};
