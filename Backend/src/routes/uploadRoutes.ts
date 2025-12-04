import { Router } from 'express';
import * as uploadController from '../controllers/uploadController';

const router = Router();

/**
 * @route   POST /api/upload/image
 * @desc    Upload image to Cloudinary
 * @access  Public
 */
router.post(
  '/image',
  uploadController.uploadMiddleware,
  uploadController.uploadImage
);

export default router;
