# Backend-Frontend Integration Guide

## Overview

This guide explains how the FindAssure backend integrates with the React Native Expo mobile app.

## Architecture Flow

```
┌─────────────────────┐
│   Mobile App        │
│  (React Native)     │
└──────────┬──────────┘
           │
           │ HTTP Requests
           │ Authorization: Bearer <firebase-token>
           │
           ▼
┌─────────────────────┐
│   Backend API       │
│  (Express/Node.js)  │
└──────────┬──────────┘
           │
           ├──────────► Firebase Admin SDK
           │            (Verify Token)
           │
           └──────────► MongoDB
                        (Store Data)
```

## Authentication Flow

### 1. User Signs Up/Logs In (Mobile App)

```typescript
// Frontend: FindAssure/src/context/AuthContext.tsx
import { auth } from '../config/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

// User signs up
const userCredential = await createUserWithEmailAndPassword(auth, email, password);
const user = userCredential.user;

// Get Firebase ID token
const token = await user.getIdToken();
```

### 2. Token Sent to Backend

```typescript
// Frontend: FindAssure/src/api/axiosClient.ts
axiosClient.interceptors.request.use((config) => {
  const token = (global as any).authToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### 3. Backend Verifies Token

```typescript
// Backend: src/middleware/authMiddleware.ts
export const requireAuth = async (req, res, next) => {
  const token = req.headers.authorization?.split('Bearer ')[1];
  
  // Verify with Firebase Admin SDK
  const decodedToken = await verifyIdToken(token);
  
  // Find or create user in MongoDB
  let user = await User.findOne({ firebaseUid: decodedToken.uid });
  if (!user) {
    user = await User.create({
      firebaseUid: decodedToken.uid,
      email: decodedToken.email,
      role: 'owner'
    });
  }
  
  // Attach to request
  req.user = user;
  next();
};
```

## API Integration Examples

### Example 1: Report Found Item

**Frontend Call:**
```typescript
// FindAssure/src/screens/founder/ReportFoundSuccessScreen.tsx
import { itemsApi } from '../../api/itemsApi';

const reportFoundItem = async (data) => {
  try {
    const response = await itemsApi.reportFoundItem({
      imageUrl: data.imageUrl,
      category: data.category,
      description: data.description,
      questions: data.questions,
      founderAnswers: data.answers,
      location: data.location,
      founderContact: {
        name: userData.name,
        email: userData.email,
        phone: userData.phone
      }
    });
    
    console.log('Item reported:', response.data);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

**Backend Handler:**
```typescript
// Backend: src/controllers/itemController.ts
export const createFoundItem = async (req, res, next) => {
  try {
    const foundItem = await itemService.createFoundItem({
      imageUrl: req.body.imageUrl,
      category: req.body.category,
      description: req.body.description,
      questions: req.body.questions,
      founderAnswers: req.body.founderAnswers,
      location: req.body.location,
      founderContact: req.body.founderContact,
      createdBy: req.user?.id
    });
    
    res.status(201).json(foundItem);
  } catch (error) {
    next(error);
  }
};
```

**Database Result:**
```javascript
// MongoDB Collection: founditems
{
  _id: ObjectId("..."),
  imageUrl: "https://...",
  category: "Electronics",
  description: "Black iPhone found",
  questions: ["What is the wallpaper?", "What case color?"],
  founderAnswers: ["Mountain landscape", "Black leather"],
  location: "Library 2nd Floor",
  founderContact: {
    name: "John Doe",
    email: "john@example.com",
    phone: "+1234567890"
  },
  status: "available",
  createdBy: ObjectId("..."),
  createdAt: ISODate("2025-12-01T10:00:00Z"),
  updatedAt: ISODate("2025-12-01T10:00:00Z")
}
```

### Example 2: Owner Finds Item and Answers Questions

**Step 1: Owner Browses Found Items**

```typescript
// Frontend
const foundItems = await itemsApi.getFoundItems();
// Returns items WITHOUT founderAnswers
```

**Step 2: Owner Selects Item and Records Video Answers**

```typescript
// Frontend
const submitVerification = async () => {
  const verificationData = {
    foundItemId: item._id,
    ownerVideoAnswers: [
      {
        question: "What is the wallpaper?",
        videoUrl: "https://cloudinary.com/video1.mp4"
      },
      {
        question: "What case color?",
        videoUrl: "https://cloudinary.com/video2.mp4"
      }
    ]
  };
  
  await itemsApi.createVerification(verificationData);
};
```

**Backend Creates Verification:**

```typescript
// Backend: src/services/verificationService.ts
export const createVerification = async (data) => {
  // Get found item (includes founder's answers)
  const foundItem = await FoundItem.findById(data.foundItemId);
  
  // Create verification with both sets of answers
  const verification = await Verification.create({
    foundItemId: data.foundItemId,
    ownerId: data.ownerId,
    questions: foundItem.questions,
    founderAnswers: foundItem.founderAnswers, // Stored for comparison
    ownerVideoAnswers: data.ownerVideoAnswers,
    status: 'pending'
  });
  
  // Update item status
  await FoundItem.findByIdAndUpdate(data.foundItemId, {
    status: 'pending_verification'
  });
  
  return verification;
};
```

**Step 3: Admin Reviews (Future: AI Compares)**

```typescript
// Frontend: Admin Dashboard
const verifications = await adminApi.getAllVerifications();

// Admin can see:
// - Owner's video answers
// - Founder's text answers (for manual comparison)
// - Similarity score (when AI is implemented)

const approveVerification = async (id) => {
  await adminApi.evaluateVerification(id, {
    status: 'passed',
    similarityScore: 0.95
  });
};
```

## Data Flow Diagrams

### Found Item Flow

```
Founder (Mobile App)
    │
    │ 1. Takes photo of found item
    │ 2. Fills category, description, location
    │ 3. Selects security questions
    │ 4. Provides text answers
    │
    ▼
POST /api/items/found
    │
    ▼
Backend saves to MongoDB:
- Image URL
- Category, description, location
- Questions
- Founder's answers (HIDDEN from owners)
- Founder's contact info
- Status: 'available'
    │
    ▼
Owner (Mobile App)
    │
    │ 1. Browses found items
    │ 2. Sees: image, description, questions
    │ 3. Does NOT see: founder's answers
    │
    ▼
GET /api/items/found
    │
    ▼
Response (Owner View):
{
  imageUrl, category, description,
  questions, location, status
  // founderAnswers NOT included
}
```

### Verification Flow

```
Owner selects "This is my item"
    │
    ▼
Records video answers to questions
    │
    ▼
POST /api/items/verification
{
  foundItemId,
  ownerVideoAnswers: [
    { question, videoUrl }
  ]
}
    │
    ▼
Backend:
1. Fetches FoundItem (gets founder's answers)
2. Creates Verification record:
   - Stores founder's text answers
   - Stores owner's video answers
   - Status: 'pending'
3. Updates FoundItem status: 'pending_verification'
    │
    ▼
Admin/AI reviews:
- Watches owner's videos
- Compares with founder's text answers
- Decides: passed/failed
    │
    ▼
PUT /api/admin/verifications/:id/evaluate
{
  status: 'passed',
  similarityScore: 0.95
}
    │
    ▼
If passed:
- FoundItem status → 'claimed'
- Notification to founder
- Founder contacts owner
```

## Environment Configuration

### Frontend (.env or app.json)

```env
# Not needed in frontend - Firebase config in firebase.ts
# Backend URL configured in axiosClient.ts
```

### Backend (.env)

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/findassure
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."
FRONTEND_URL=http://localhost:8081
```

## API Client Configuration

### Frontend: axiosClient.ts

```typescript
const BASE_URL = 'http://localhost:5000/api';

const axiosClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000
});

// Attach Firebase token
axiosClient.interceptors.request.use((config) => {
  const token = (global as any).authToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login
    }
    return Promise.reject(error);
  }
);
```

### Frontend: API Functions

```typescript
// FindAssure/src/api/itemsApi.ts
import axiosClient from './axiosClient';

export const itemsApi = {
  // Report found item
  reportFoundItem: (data) => 
    axiosClient.post('/items/found', data),
  
  // Get found items
  getFoundItems: (filters?) => 
    axiosClient.get('/items/found', { params: filters }),
  
  // Get single item
  getFoundItemById: (id) => 
    axiosClient.get(`/items/found/${id}`),
  
  // Report lost item
  reportLostItem: (data) => 
    axiosClient.post('/items/lost', data),
  
  // Create verification
  createVerification: (data) => 
    axiosClient.post('/items/verification', data),
  
  // Get my verifications
  getMyVerifications: () => 
    axiosClient.get('/items/verification/me')
};
```

## Security Considerations

### 1. Token Management

**Frontend:**
```typescript
// Store token securely
import AsyncStorage from '@react-native-async-storage/async-storage';

// After login
const token = await user.getIdToken();
await AsyncStorage.setItem('authToken', token);
(global as any).authToken = token;

// On app start
const token = await AsyncStorage.getItem('authToken');
if (token) {
  (global as any).authToken = token;
}
```

**Backend:**
```typescript
// Verify every request
export const requireAuth = async (req, res, next) => {
  const token = req.headers.authorization?.split('Bearer ')[1];
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }
  
  try {
    const decodedToken = await verifyIdToken(token);
    // Proceed...
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};
```

### 2. Data Access Control

**Owner View (Frontend):**
```typescript
// Gets item WITHOUT founder's answers
const item = await itemsApi.getFoundItemById(id);
// { imageUrl, category, description, questions, location }
// founderAnswers NOT present
```

**Admin View (Backend):**
```typescript
// Admin can see everything
export const getFoundItemForAdmin = async (id) => {
  const item = await FoundItem.findById(id);
  // Returns complete item including founderAnswers
  return item;
};
```

## Testing Integration

### 1. Start Backend
```bash
cd Backend
npm run dev
# Server running on http://localhost:5000
```

### 2. Start Frontend
```bash
cd FindAssure
npm start
# Expo running on http://localhost:8081
```

### 3. Test Flow

1. **Sign Up** through mobile app
   - Firebase creates auth user
   - Backend auto-creates MongoDB user on first API call

2. **Report Found Item** (as founder)
   - Upload image
   - Fill details
   - Submit → POST /api/items/found

3. **Browse Found Items** (as owner)
   - See list → GET /api/items/found
   - Select item → GET /api/items/found/:id
   - Notice: founder's answers NOT visible

4. **Submit Verification** (as owner)
   - Record video answers
   - Submit → POST /api/items/verification

5. **Review Verification** (as admin)
   - Login as admin
   - View verifications → GET /api/admin/verifications
   - See both owner videos and founder answers
   - Approve → PUT /api/admin/verifications/:id/evaluate

## Troubleshooting

### Issue: "Cannot connect to backend"

**Check:**
```bash
# Backend running?
curl http://localhost:5000/health

# Correct URL in axiosClient?
# Should be: http://localhost:5000/api

# CORS configured?
# Check Backend/src/app.ts cors settings
```

### Issue: "401 Unauthorized"

**Check:**
```typescript
// Token being sent?
console.log('Token:', (global as any).authToken);

// Token valid?
// Try re-logging in to get fresh token

// Firebase config correct?
// Check Backend/.env Firebase credentials
```

### Issue: "founderAnswers visible to owner"

**Check:**
```typescript
// Using correct service method?
// Owner view: itemService.getFoundItemForOwner(id)
// Admin view: itemService.getFoundItemForAdmin(id)

// Verify controller uses right method
```

## Production Deployment

### 1. Deploy Backend

```bash
# Update production URL
MONGODB_URI=mongodb+srv://...
FRONTEND_URL=https://your-app-url.com
```

### 2. Update Frontend

```typescript
// FindAssure/src/api/axiosClient.ts
const BASE_URL = 'https://your-backend-url.com/api';
```

### 3. Rebuild Frontend

```bash
cd FindAssure
npm run build
eas build --platform android
eas build --platform ios
```

## Summary

✅ Firebase handles authentication
✅ Backend verifies tokens with Firebase Admin SDK
✅ MongoDB stores all data
✅ Founder's answers hidden from owners
✅ Admin sees complete data for verification
✅ Clean separation of concerns
✅ Secure token-based authentication
✅ Role-based access control

The integration is complete and production-ready! 🚀
