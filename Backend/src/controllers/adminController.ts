import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { FoundItem } from '../models/FoundItem';
import { LostRequest } from '../models/LostRequest';
import { Verification } from '../models/Verification';
import * as itemService from '../services/itemService';
import * as verificationService from '../services/verificationService';

/**
 * Get dashboard overview statistics
 * GET /api/admin/overview
 */
export const getOverview = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const [
      totalUsers,
      totalFoundItems,
      totalLostRequests,
      totalVerifications,
      pendingVerifications,
    ] = await Promise.all([
      User.countDocuments(),
      FoundItem.countDocuments(),
      LostRequest.countDocuments(),
      Verification.countDocuments(),
      verificationService.getPendingVerificationsCount(),
    ]);

    res.status(200).json({
      totalUsers,
      totalFoundItems,
      totalLostRequests,
      totalVerifications,
      pendingVerifications,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all found items (admin view with full details)
 * GET /api/admin/found-items
 */
export const getAllFoundItems = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const items = await itemService.getAllFoundItemsForAdmin();
    res.status(200).json(items);
  } catch (error) {
    next(error);
  }
};

/**
 * Update found item status
 * PATCH /api/admin/found-items/:id
 */
export const updateFoundItemStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['available', 'pending_verification', 'claimed'].includes(status)) {
      res.status(400).json({ message: 'Invalid status value' });
      return;
    }

    const item = await itemService.updateFoundItemStatus(id, status);

    if (!item) {
      res.status(404).json({ message: 'Found item not found' });
      return;
    }

    res.status(200).json(item);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all users
 * GET /api/admin/users
 */
export const getAllUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const users = await User.find().sort({ createdAt: -1 }).select('-__v');
    res.status(200).json(users);
  } catch (error) {
    next(error);
  }
};

/**
 * Update user details
 * PATCH /api/admin/users/:id
 */
export const updateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, phone, role } = req.body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (role !== undefined && ['owner', 'founder', 'admin'].includes(role)) {
      updateData.role = role;
    }

    const user = await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).select('-__v');

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all verifications (admin view)
 * GET /api/admin/verifications
 */
export const getAllVerifications = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const verifications = await verificationService.getAllVerifications();
    res.status(200).json(verifications);
  } catch (error) {
    next(error);
  }
};

/**
 * Evaluate verification (for future AI implementation)
 * PUT /api/admin/verifications/:id/evaluate
 */
export const evaluateVerification = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, similarityScore } = req.body;

    if (!status || !['pending', 'passed', 'failed'].includes(status)) {
      res.status(400).json({ message: 'Invalid status value' });
      return;
    }

    const verification = await verificationService.evaluateVerification(id, {
      status,
      similarityScore,
    });

    if (!verification) {
      res.status(404).json({ message: 'Verification not found' });
      return;
    }

    res.status(200).json(verification);
  } catch (error) {
    next(error);
  }
};
