const express = require('express');
const cors = require('cors');
require('dotenv').config();

const questionsRoutes = require('./routes/questions');
const itemsRoutes = require('./routes/items');
const verificationRoutes = require('./routes/verification');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
// CORS configuration - allow multiple origins
const allowedOrigins = [
  'http://localhost:5173',  // React web app (Vite)
  'http://localhost:5174',  // React web app (Vite alternate port)
  'http://localhost:8080',  // Flutter web
  'http://localhost:3000',  // Same origin
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.CORS_ORIGIN === '*') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'ai-question-service',
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use('/api/questions', questionsRoutes);
app.use('/api/items', itemsRoutes);
app.use('/api/verification', verificationRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'AI-Driven Lost & Found Verification System - Question Service',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      generateQuestions: 'POST /api/questions/generate',
      createItem: 'POST /api/items/create',
      getItem: 'GET /api/items/:itemId',
      getAllItems: 'GET /api/items',
      getItemQuestions: 'GET /api/verification/item/:itemId/questions',
      submitVerification: 'POST /api/verification/submit',
      getVerifications: 'GET /api/verification/item/:itemId',
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.path,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// Start server
app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log(`🚀 AI Question Service running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Base URL: http://localhost:${PORT}`);
  console.log(`💚 Health check: http://localhost:${PORT}/health`);
  console.log('='.repeat(50));
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

module.exports = app;
