import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware';
import * as authController from '../controllers/authController';

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register new user (after Firebase authentication)
 * @access  Public (requires Firebase token)
 */
router.post('/register', authController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user (verify Firebase token)
 * @access  Public (requires Firebase token)
 */
router.post('/login', authController.login);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', requireAuth, authController.getCurrentUser);

/**
 * @route   PATCH /api/auth/me
 * @desc    Update current user profile
 * @access  Private
 */
router.patch('/me', requireAuth, authController.updateCurrentUser);

/**
 * @route   POST /api/auth/register-extra
 * @desc    Register additional user information
 * @access  Private
 */
router.post('/register-extra', requireAuth, authController.registerExtraInfo);

/**
 * @route   GET /api/auth/claimed-items
 * @desc    Get claimed items for current user
 * @access  Private
 */
router.get('/claimed-items', requireAuth, authController.getClaimedItems);

export default router;
