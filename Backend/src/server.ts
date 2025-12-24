import dotenv from 'dotenv';
import { createApp } from './app';
import { connectDB } from './config/db';
import { initializeFirebaseAdmin } from './config/firebaseAdmin';

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
  'MONGODB_URI',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
];

const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingEnvVars.forEach((envVar) => console.error(`   - ${envVar}`));
  process.exit(1);
}

// Server configuration
const PORT = process.env.PORT || 5001;

/**
 * Start the server
 */
const startServer = async (): Promise<void> => {
  try {
    console.log('🚀 Starting FindAssure Backend...\n');

    // Initialize Firebase Admin SDK
    initializeFirebaseAdmin();

    // Connect to MongoDB
    await connectDB();

    // Create Express app
    const app = createApp();

    // Start listening on all network interfaces (0.0.0.0) for mobile access
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`\n✅ Server is running on port ${PORT}`);
      console.log(`📍 API Base URL: http://localhost:${PORT}/api`);
      console.log(`🏥 Health Check: http://localhost:${PORT}/health\n`);

      if (process.env.NODE_ENV === 'development') {
        console.log('🔧 Running in DEVELOPMENT mode');
        console.log(`📱 Mobile Access: http://172.20.10.2:${PORT}/api\n`);
      }
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
startServer();
