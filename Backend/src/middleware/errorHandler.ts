import { Request, Response, NextFunction } from 'express';

/**
 * Centralized error handling middleware
 * Should be added at the end of all routes
 */
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('❌ Error:', err);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    res.status(400).json({
      message: 'Validation error',
      errors: Object.values(err.errors).map((e: any) => e.message),
    });
    return;
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    res.status(409).json({
      message: `Duplicate value for field: ${field}`,
    });
    return;
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    res.status(400).json({
      message: 'Invalid ID format',
    });
    return;
  }

  // JWT/Firebase token errors
  if (err.message?.includes('token') || err.message?.includes('auth')) {
    res.status(401).json({
      message: err.message || 'Authentication failed',
    });
    return;
  }

  // Default error
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
