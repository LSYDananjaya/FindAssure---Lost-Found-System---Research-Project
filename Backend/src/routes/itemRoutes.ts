import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware';
import * as itemController from '../controllers/itemController';

const router = Router();

// ============================================
// FOUND ITEMS ROUTES
// ============================================

/**
 * @route   POST /api/items/found
 * @desc    Create a found item report
 * @access  Public/Private (optional auth)
 */
router.post('/found', itemController.createFoundItem);

/**
 * @route   GET /api/items/found
 * @desc    List all found items (owner view - no founder answers)
 * @access  Public
 */
router.get('/found', itemController.listFoundItems);

/**
 * @route   GET /api/items/found/:id
 * @desc    Get single found item by ID
 * @access  Public (owner view) / Admin (full view)
 */
router.get('/found/:id', itemController.getFoundItemById);

// ============================================
// LOST ITEMS ROUTES
// ============================================

/**
 * @route   POST /api/items/lost
 * @desc    Create a lost item request
 * @access  Private
 */
router.post('/lost', requireAuth, itemController.createLostRequest);

/**
 * @route   GET /api/items/lost/me
 * @desc    Get my lost item requests
 * @access  Private
 */
router.get('/lost/me', requireAuth, itemController.getMyLostRequests);

// ============================================
// AI QUESTION GENERATION
// ============================================

/**
 * @route   POST /api/items/generate-questions
 * @desc    Generate verification questions using AI
 * @access  Public
 */
router.post('/generate-questions', itemController.generateQuestions);

// ============================================
// VERIFICATION ROUTES
// ============================================
 
/**
 * @route   POST /api/items/verification
 * @desc    Create verification with video answers
 * @access  Private
 */
router.post('/verification', requireAuth, itemController.createVerification);

/**
 * @route   GET /api/items/verification/:id
 * @desc    Get verification by ID
 * @access  Private (owner - no founder answers) / Admin (full view)
 */
router.get('/verification/:id', requireAuth, itemController.getVerificationById);

/**
 * @route   GET /api/items/verification/me
 * @desc    Get my verifications
 * @access  Private
 */
router.get('/verification/me', requireAuth, itemController.getMyVerifications);

export default router;
