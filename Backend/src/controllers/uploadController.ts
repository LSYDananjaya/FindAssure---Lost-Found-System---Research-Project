import { Request, Response, NextFunction } from 'express';
import { upload, uploadToCloudinary, isCloudinaryConfigured } from '../utils/cloudinary';

/**
 * Upload image endpoint
 * POST /api/upload/image
 */
export const uploadImage = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Debug logging
    console.log('📤 Upload request received');
    console.log('🔑 Cloudinary Config:', {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY ? '***' + process.env.CLOUDINARY_API_KEY.slice(-4) : 'NOT SET',
      api_secret: process.env.CLOUDINARY_API_SECRET ? 'SET' : 'NOT SET',
    });

    // Check if Cloudinary is configured
    if (!isCloudinaryConfigured()) {
      res.status(500).json({
        message: 'Image upload service is not configured',
      });
      return;
    }

    // Check if file exists
    if (!req.file) {
      res.status(400).json({
        message: 'No image file provided',
      });
      return;
    }

    console.log('📁 File received:', req.file.originalname, req.file.size, 'bytes');

    // Upload to Cloudinary
    const result = await uploadToCloudinary(req.file.buffer, 'findassure/found-items');

    res.status(200).json({
      message: 'Image uploaded successfully',
      imageUrl: result.secure_url,
      publicId: result.public_id,
    });
  } catch (error) {
    next(error);
  }
};

export const uploadMiddleware = upload.single('image');
