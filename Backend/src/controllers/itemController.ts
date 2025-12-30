import { Request, Response, NextFunction } from 'express';
import * as itemService from '../services/itemService';
import * as verificationService from '../services/verificationService';
import * as geminiService from '../services/geminiService';

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
      found_location,
      founderContact,
    } = req.body;

    // Validation (imageUrl is optional)
    if (!category || !description || !questions || !founderAnswers || !found_location || !founderContact) {
      res.status(400).json({ message: 'Required fields: category, description, questions, founderAnswers, found_location, founderContact' });
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
      imageUrl: imageUrl || 'https://via.placeholder.com/400x400/CCCCCC/666666?text=No+Image',
      category,
      description,
      questions,
      founderAnswers,
      found_location,
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

    const { category, description, owner_location, floor_id, hall_name, owner_location_confidence_stage } = req.body;

    if (!category || !description || !owner_location || owner_location_confidence_stage === undefined) {
      res.status(400).json({ message: 'Category, description, owner_location, and confidence stage are required' });
      return;
    }

    if (owner_location_confidence_stage < 1 || owner_location_confidence_stage > 3) {
      res.status(400).json({ message: 'Confidence stage must be 1 (Pretty Sure), 2 (Sure), or 3 (Not Sure)' });
      return;
    }

    const lostRequest = await itemService.createLostRequest(req.user.id, {
      category,
      description,
      owner_location,
      floor_id,
      hall_name,
      owner_location_confidence_stage,
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

    const { foundItemId, ownerAnswers } = req.body;

    if (!foundItemId || !ownerAnswers) {
      res.status(400).json({ message: 'foundItemId and ownerAnswers are required' });
      return;
    }

    const verification = await verificationService.createVerification({
      foundItemId,
      ownerId: req.user.id,
      ownerAnswers,
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

/**
 * Generate verification questions using AI
 * POST /api/items/generate-questions
 */
export const generateQuestions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { category, description } = req.body;

    // Validation
    if (!category || !description) {
      res.status(400).json({ message: 'Category and description are required' });
      return;
    }

    // Generate questions using Gemini AI
    const questions = await geminiService.generateVerificationQuestions({
      category,
      description,
    });

    res.status(200).json({ questions });
  } catch (error) {
    next(error);
  }
};
