import { Request, Response, NextFunction } from 'express';
import * as itemService from '../services/itemService';
import * as verificationService from '../services/verificationService';

/**
 * Create a found item
 * POST /api/items/found
 */
export const createFoundItem = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      imageUrl,
      category,
      description,
      questions,
      founderAnswers,
      location,
      founderContact,
    } = req.body;

    // Validation
    if (!imageUrl || !category || !description || !questions || !founderAnswers || !location || !founderContact) {
      res.status(400).json({ message: 'All fields are required' });
      return;
    }

    if (questions.length === 0) {
      res.status(400).json({ message: 'At least one question is required' });
      return;
    }

    if (questions.length !== founderAnswers.length) {
      res.status(400).json({ message: 'Number of answers must match number of questions' });
      return;
    }

    const foundItem = await itemService.createFoundItem({
      imageUrl,
      category,
      description,
      questions,
      founderAnswers,
      location,
      founderContact,
      createdBy: req.user?.id,
    });

    res.status(201).json(foundItem);
  } catch (error) {
    next(error);
  }
};

/**
 * List found items
 * GET /api/items/found
 */
export const listFoundItems = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { category, status } = req.query;

    const filters: itemService.FoundItemFilters = {};
    if (category) filters.category = category as string;
    if (status) filters.status = status as any;

    const items = await itemService.listFoundItems(filters);

    // For owner view, remove founderAnswers from all items
    const itemsForOwner = items.map((item) => {
      const itemObj = item.toObject();
      const { founderAnswers, ...ownerView } = itemObj;
      return ownerView;
    });

    res.status(200).json(itemsForOwner);
  } catch (error) {
    next(error);
  }
};

/**
 * Get single found item
 * GET /api/items/found/:id
 */
export const getFoundItemById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if user is admin
    const isAdmin = req.user?.role === 'admin';

    let item;
    if (isAdmin) {
      item = await itemService.getFoundItemForAdmin(id);
    } else {
      item = await itemService.getFoundItemForOwner(id);
    }

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
 * Create a lost request
 * POST /api/items/lost
 */
export const createLostRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const { category, description, location, confidenceLevel } = req.body;

    if (!category || !description || !location || confidenceLevel === undefined) {
      res.status(400).json({ message: 'Category, description, location, and confidence level are required' });
      return;
    }

    if (confidenceLevel < 1 || confidenceLevel > 100) {
      res.status(400).json({ message: 'Confidence level must be between 1 and 100' });
      return;
    }

    const lostRequest = await itemService.createLostRequest(req.user.id, {
      category,
      description,
      location,
      confidenceLevel,
    });

    res.status(201).json(lostRequest);
  } catch (error) {
    next(error);
  }
};

/**
 * Get my lost requests
 * GET /api/items/lost/me
 */
export const getMyLostRequests = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const requests = await itemService.getLostRequestsByOwner(req.user.id);

    res.status(200).json(requests);
  } catch (error) {
    next(error);
  }
};

/**
 * Create verification
 * POST /api/items/verification
 */
export const createVerification = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const { foundItemId, ownerVideoAnswers } = req.body;

    if (!foundItemId || !ownerVideoAnswers) {
      res.status(400).json({ message: 'foundItemId and ownerVideoAnswers are required' });
      return;
    }

    const verification = await verificationService.createVerification({
      foundItemId,
      ownerId: req.user.id,
      ownerVideoAnswers,
    });

    res.status(201).json(verification);
  } catch (error) {
    next(error);
  }
};

/**
 * Get verification by ID
 * GET /api/items/verification/:id
 */
export const getVerificationById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const { id } = req.params;
    const isAdmin = req.user.role === 'admin';

    const verification = await verificationService.getVerificationById(id, isAdmin);

    if (!verification) {
      res.status(404).json({ message: 'Verification not found' });
      return;
    }

    res.status(200).json(verification);
  } catch (error) {
    next(error);
  }
};

/**
 * Get my verifications
 * GET /api/items/verification/me
 */
export const getMyVerifications = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const verifications = await verificationService.getVerificationsByOwner(req.user.id);

    res.status(200).json(verifications);
  } catch (error) {
    next(error);
  }
};
