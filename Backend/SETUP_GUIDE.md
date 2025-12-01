# Backend Setup & Development Guide

## Prerequisites

Before starting, ensure you have:

1. **Node.js** (v18 or higher)
2. **MongoDB** (local or cloud instance like MongoDB Atlas)
3. **Firebase Project** with Authentication enabled
4. **Firebase Service Account Key** (JSON file)

## Step-by-Step Setup

### 1. Install Dependencies

Navigate to the Backend directory and install packages:

```bash
cd Backend
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the Backend directory:

```bash
cp .env.example .env
```

Edit the `.env` file with your actual values:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/findassure
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/findassure?retryWrites=true&w=majority

# Firebase Admin SDK Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Private-Key-Here\n-----END PRIVATE KEY-----\n"

# CORS Configuration
FRONTEND_URL=http://localhost:8081
```

### 3. Get Firebase Service Account Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Project Settings** → **Service Accounts**
4. Click **Generate New Private Key**
5. Download the JSON file
6. Extract the following values to your `.env`:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY` (keep the `\n` characters)

### 4. Start MongoDB

**Local MongoDB:**
```bash
# Windows
net start MongoDB

# macOS/Linux
sudo systemctl start mongod
```

**MongoDB Atlas:**
- Already running in the cloud
- Just use the connection string in `MONGODB_URI`

### 5. Start Development Server

```bash
npm run dev
```

You should see:
```
🚀 Starting FindAssure Backend...
✅ Firebase Admin SDK initialized successfully
✅ MongoDB connected successfully
✅ Server is running on port 5000
📍 API Base URL: http://localhost:5000/api
🏥 Health Check: http://localhost:5000/health
🔧 Running in DEVELOPMENT mode
```

### 6. Test the API

Test the health check endpoint:

```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "ok",
  "message": "FindAssure Backend API is running",
  "timestamp": "2025-12-01T..."
}
```

## API Testing with Postman/Thunder Client

### 1. Get Firebase ID Token

First, login through your mobile app to get a Firebase ID token. The token will be available in the app's authentication state.

Alternatively, use Firebase Auth REST API:

```bash
# Sign in
POST https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=YOUR_API_KEY
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "returnSecureToken": true
}
```

Copy the `idToken` from the response.

### 2. Test Protected Endpoints

Use the token in the Authorization header:

```bash
GET http://localhost:5000/api/auth/me
Authorization: Bearer YOUR_ID_TOKEN
```

## Common Issues & Solutions

### Issue: "MONGODB_URI is not defined"
**Solution:** Ensure `.env` file exists and contains `MONGODB_URI`

### Issue: "Firebase Admin SDK initialization failed"
**Solution:** Check that all Firebase credentials in `.env` are correct. The private key should include `\n` characters.

### Issue: "Port 5000 already in use"
**Solution:** Change `PORT` in `.env` to a different port (e.g., 5001)

### Issue: "Cannot connect to MongoDB"
**Solution:** 
- Check if MongoDB is running
- Verify connection string is correct
- For Atlas, check network access settings (allow your IP)

## Development Workflow

1. **Make changes** to code in `src/`
2. **Auto-restart** - ts-node-dev will automatically restart the server
3. **Test endpoints** using Postman, Thunder Client, or mobile app
4. **Check logs** in terminal for errors

## Building for Production

```bash
# Build TypeScript to JavaScript
npm run build

# Run production build
npm start
```

The compiled code will be in the `dist/` directory.

## Project Structure Reference

```
Backend/
├── src/
│   ├── app.ts                 # Express app setup
│   ├── server.ts              # Server entry point
│   ├── config/
│   │   ├── db.ts             # MongoDB connection
│   │   └── firebaseAdmin.ts  # Firebase Admin SDK
│   ├── middleware/
│   │   ├── authMiddleware.ts # Auth & authorization
│   │   └── errorHandler.ts   # Error handling
│   ├── models/
│   │   ├── User.ts           # User model
│   │   ├── FoundItem.ts      # Found item model
│   │   ├── LostRequest.ts    # Lost request model
│   │   └── Verification.ts   # Verification model
│   ├── controllers/
│   │   ├── authController.ts
│   │   ├── itemController.ts
│   │   └── adminController.ts
│   ├── routes/
│   │   ├── authRoutes.ts
│   │   ├── itemRoutes.ts
│   │   └── adminRoutes.ts
│   ├── services/
│   │   ├── itemService.ts
│   │   └── verificationService.ts
│   └── utils/
│       └── types.ts
├── .env                       # Environment variables (create this)
├── .env.example              # Environment template
├── package.json
├── tsconfig.json
└── README.md
```

## Next Steps

1. ✅ Backend is now running
2. 🔄 Update frontend to use the new backend (already done)
3. 📱 Test the mobile app with the backend
4. 🧪 Create admin user for testing admin features
5. 🚀 Deploy to production (Heroku, Railway, AWS, etc.)

## Support

For issues or questions:
- Check the main README.md
- Review API documentation below
- Check terminal logs for errors

---

## Quick API Reference

### Authentication
- `GET /api/auth/me` - Get current user
- `PATCH /api/auth/me` - Update profile

### Items
- `POST /api/items/found` - Report found item
- `GET /api/items/found` - List found items
- `GET /api/items/found/:id` - Get found item details
- `POST /api/items/lost` - Report lost item
- `GET /api/items/lost/me` - Get my lost reports

### Verification
- `POST /api/items/verification` - Submit verification
- `GET /api/items/verification/:id` - Get verification details

### Admin (requires admin role)
- `GET /api/admin/overview` - Dashboard stats
- `GET /api/admin/found-items` - All found items
- `PATCH /api/admin/found-items/:id` - Update item status
- `GET /api/admin/users` - All users
- `PATCH /api/admin/users/:id` - Update user
- `GET /api/admin/verifications` - All verifications
- `PUT /api/admin/verifications/:id/evaluate` - Evaluate verification
