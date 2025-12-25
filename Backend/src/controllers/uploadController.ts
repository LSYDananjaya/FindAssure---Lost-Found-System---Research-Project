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

    // Check if file exists
    if (!req.file) {
      res.status(400).json({
        message: 'No image file provided',
      });
      return;
    }

    console.log('📁 File received:', req.file.originalname, req.file.size, 'bytes');

    // Check if Cloudinary is configured
    if (!isCloudinaryConfigured()) {
      console.warn('⚠️ Cloudinary not configured - using placeholder');
      // Return a placeholder URL when Cloudinary is not configured
      res.status(200).json({
        message: 'Image uploaded (placeholder - Cloudinary not configured)',
        imageUrl: `https://via.placeholder.com/400x400/007AFF/FFFFFF?text=${encodeURIComponent(req.file.originalname)}`,
        publicId: 'placeholder',
      });
      return;
    }

    try {
      console.log('☁️ Attempting Cloudinary upload...');
      
      // Create upload promise with proper error handling
      const result = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
        uploadToCloudinary(req.file!.buffer, 'findassure/found-items')
          .then(resolve)
          .catch((err) => {
            console.error('Cloudinary promise rejected:', err);
            reject(err);
          });
        
        // Timeout after 10 seconds
        setTimeout(() => {
          reject(new Error('Cloudinary upload timeout'));
        }, 10000);
      });

      console.log('✅ Cloudinary upload successful');
      res.status(200).json({
        message: 'Image uploaded successfully',
        imageUrl: result.secure_url,
        publicId: result.public_id,
      });
    } catch (cloudinaryError: any) {
      console.error('❌ Cloudinary upload failed:', cloudinaryError.message || cloudinaryError);
      
      // Return placeholder if Cloudinary fails
      console.log('⚠️ Returning placeholder image');
      res.status(200).json({
        message: 'Image upload failed, using placeholder',
        imageUrl: `https://via.placeholder.com/400x400/FF6B6B/FFFFFF?text=${encodeURIComponent(req.file!.originalname)}`,
        publicId: 'placeholder-error',
        warning: cloudinaryError.message || 'Upload failed',
      });
    }
  } catch (error: any) {
    console.error('❌ Upload endpoint error:', error);
    // Ensure we always send a response
    if (!res.headersSent) {
      res.status(500).json({
        message: 'Upload failed',
        error: error.message,
      });
    }
  }
};

export const uploadMiddleware = upload.single('image');
