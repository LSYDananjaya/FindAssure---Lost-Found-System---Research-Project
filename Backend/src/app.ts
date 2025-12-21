import express, { Application } from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes';
import itemRoutes from './routes/itemRoutes';
import adminRoutes from './routes/adminRoutes';
import uploadRoutes from './routes/uploadRoutes';
import { errorHandler } from './middleware/errorHandler';

/**
 * Create and configure Express application
 */
export const createApp = (): Application => {
  const app = express();

  // ============================================
  // MIDDLEWARE
  // ============================================

  // CORS configuration
  const allowedOrigins = process.env.FRONTEND_URL 
    ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
    : ['http://localhost:8081'];
  
  app.use(
    cors({
      origin: [
        ...allowedOrigins,
        'http://localhost:3000',  // Web frontend (Vite)
        'http://localhost:5173',  // Location Similarity Web (Vite)
        'http://localhost:5174',  // Location Similarity Web (Vite alt port)
        'http://192.168.113.106:8081',  // Mobile app (network)
        'http://localhost:19006',  // Expo dev server
        'http://192.168.113.106:19006'
      ],
      credentials: true,
    })
  );

  // Body parser
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Request logging (development only)
  if (process.env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
      console.log(`${req.method} ${req.path}`);
      next();
    });
  }

  // ============================================
  // ROUTES
  // ============================================

  // Health check
  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'ok',
      message: 'FindAssure Backend API is running',
      timestamp: new Date().toISOString(),
    });
  });

  // API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/items', itemRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/upload', uploadRoutes);

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      message: 'Route not found',
      path: req.path,
    });
  });

  // ============================================
  // ERROR HANDLER (Must be last)
  // ============================================

  app.use(errorHandler);

  return app;
};
