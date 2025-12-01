# FindAssure Backend - API Documentation

Base URL: `http://localhost:5000/api`

All requests must include `Content-Type: application/json` header.
Protected routes require `Authorization: Bearer <firebase_token>` header.

---

## Authentication Endpoints

### Get Current User Profile
```http
GET /api/auth/me
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "firebaseUid": "abc123xyz",
  "email": "user@example.com",
  "name": "John Doe",
  "phone": "+1234567890",
  "role": "owner",
  "createdAt": "2025-12-01T10:00:00.000Z",
  "updatedAt": "2025-12-01T10:00:00.000Z"
}
```

### Update User Profile
```http
PATCH /api/auth/me
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Jane Doe",
  "phone": "+9876543210"
}
```

**Response (200 OK):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "name": "Jane Doe",
  "phone": "+9876543210",
  "role": "owner"
}
```

### Register Additional Information
```http
POST /api/auth/register-extra
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Doe",
  "phone": "+1234567890",
  "role": "founder"
}
```

---

## Found Items Endpoints

### Report Found Item
```http
POST /api/items/found
Content-Type: application/json

{
  "imageUrl": "https://example.com/image.jpg",
  "category": "Electronics",
  "description": "Black iPhone found near library",
  "questions": [
    "What is the lock screen wallpaper?",
    "What color is the phone case?",
    "Are there any stickers on the back?"
  ],
  "founderAnswers": [
    "Mountain landscape",
    "Black leather case",
    "Yes, a university logo sticker"
  ],
  "location": "Main Library, 2nd Floor",
  "founderContact": {
    "name": "Founder Name",
    "email": "founder@example.com",
    "phone": "+1234567890"
  }
}
```

**Response (201 Created):**
```json
{
  "_id": "507f1f77bcf86cd799439012",
  "imageUrl": "https://example.com/image.jpg",
  "category": "Electronics",
  "description": "Black iPhone found near library",
  "questions": ["..."],
  "founderAnswers": ["..."],
  "location": "Main Library, 2nd Floor",
  "founderContact": {...},
  "status": "available",
  "createdAt": "2025-12-01T10:00:00.000Z"
}
```

### List All Found Items
```http
GET /api/items/found?category=Electronics&status=available
```

**Query Parameters:**
- `category` (optional): Filter by category
- `status` (optional): Filter by status (`available`, `pending_verification`, `claimed`)

**Response (200 OK):**
```json
[
  {
    "_id": "507f1f77bcf86cd799439012",
    "imageUrl": "https://example.com/image.jpg",
    "category": "Electronics",
    "description": "Black iPhone found near library",
    "questions": ["What is the lock screen wallpaper?", "..."],
    "location": "Main Library, 2nd Floor",
    "status": "available",
    "createdAt": "2025-12-01T10:00:00.000Z"
    // Note: founderAnswers NOT included for owner view
  }
]
```

### Get Single Found Item
```http
GET /api/items/found/:id
```

**Response (200 OK) - Owner View:**
```json
{
  "_id": "507f1f77bcf86cd799439012",
  "imageUrl": "https://example.com/image.jpg",
  "category": "Electronics",
  "description": "Black iPhone found near library",
  "questions": ["What is the lock screen wallpaper?", "..."],
  "location": "Main Library, 2nd Floor",
  "status": "available"
  // founderAnswers are HIDDEN from owners
}
```

**Response (200 OK) - Admin View:**
```json
{
  "_id": "507f1f77bcf86cd799439012",
  "imageUrl": "https://example.com/image.jpg",
  "category": "Electronics",
  "description": "Black iPhone found near library",
  "questions": ["..."],
  "founderAnswers": ["Mountain landscape", "..."],
  "founderContact": {
    "name": "Founder Name",
    "email": "founder@example.com",
    "phone": "+1234567890"
  },
  "location": "Main Library, 2nd Floor",
  "status": "available"
  // Admin can see ALL details including founderAnswers
}
```

---

## Lost Items Endpoints

### Report Lost Item
```http
POST /api/items/lost
Authorization: Bearer <token>
Content-Type: application/json

{
  "category": "Electronics",
  "description": "Lost black iPhone near campus library"
}
```

**Response (201 Created):**
```json
{
  "_id": "507f1f77bcf86cd799439013",
  "ownerId": "507f1f77bcf86cd799439011",
  "category": "Electronics",
  "description": "Lost black iPhone near campus library",
  "matchedFoundItemIds": [],
  "createdAt": "2025-12-01T10:00:00.000Z"
}
```

### Get My Lost Reports
```http
GET /api/items/lost/me
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
[
  {
    "_id": "507f1f77bcf86cd799439013",
    "ownerId": "507f1f77bcf86cd799439011",
    "category": "Electronics",
    "description": "Lost black iPhone near campus library",
    "createdAt": "2025-12-01T10:00:00.000Z"
  }
]
```

---

## Verification Endpoints

### Create Verification
```http
POST /api/items/verification
Authorization: Bearer <token>
Content-Type: application/json

{
  "foundItemId": "507f1f77bcf86cd799439012",
  "ownerVideoAnswers": [
    {
      "question": "What is the lock screen wallpaper?",
      "videoUrl": "https://example.com/video1.mp4"
    },
    {
      "question": "What color is the phone case?",
      "videoUrl": "https://example.com/video2.mp4"
    }
  ]
}
```

**Response (201 Created):**
```json
{
  "_id": "507f1f77bcf86cd799439014",
  "foundItemId": "507f1f77bcf86cd799439012",
  "ownerId": "507f1f77bcf86cd799439011",
  "questions": ["What is the lock screen wallpaper?", "..."],
  "ownerVideoAnswers": [
    {
      "question": "What is the lock screen wallpaper?",
      "videoUrl": "https://example.com/video1.mp4"
    }
  ],
  "status": "pending",
  "similarityScore": null,
  "createdAt": "2025-12-01T10:00:00.000Z"
  // founderAnswers NOT included in owner view
}
```

### Get Verification Details
```http
GET /api/items/verification/:id
Authorization: Bearer <token>
```

**Response (200 OK) - Owner View:**
```json
{
  "_id": "507f1f77bcf86cd799439014",
  "foundItemId": {...},
  "ownerId": {...},
  "questions": ["..."],
  "ownerVideoAnswers": [...],
  "status": "pending",
  "similarityScore": null
  // founderAnswers HIDDEN from owner
}
```

**Response (200 OK) - Admin View:**
```json
{
  "_id": "507f1f77bcf86cd799439014",
  "foundItemId": {...},
  "ownerId": {...},
  "questions": ["..."],
  "founderAnswers": ["Mountain landscape", "..."],
  "ownerVideoAnswers": [...],
  "status": "pending",
  "similarityScore": null
  // Admin can see founderAnswers for comparison
}
```

### Get My Verifications
```http
GET /api/items/verification/me
Authorization: Bearer <token>
```

---

## Admin Endpoints

All admin endpoints require:
- `Authorization: Bearer <token>`
- User must have `role: "admin"`

### Get Dashboard Overview
```http
GET /api/admin/overview
Authorization: Bearer <admin_token>
```

**Response (200 OK):**
```json
{
  "totalUsers": 150,
  "totalFoundItems": 45,
  "totalLostRequests": 32,
  "totalVerifications": 18,
  "pendingVerifications": 5
}
```

### Get All Found Items (Admin View)
```http
GET /api/admin/found-items
Authorization: Bearer <admin_token>
```

**Response (200 OK):**
```json
[
  {
    "_id": "507f1f77bcf86cd799439012",
    "imageUrl": "https://example.com/image.jpg",
    "category": "Electronics",
    "description": "Black iPhone found near library",
    "questions": ["..."],
    "founderAnswers": ["Mountain landscape", "..."],
    "founderContact": {
      "name": "Founder Name",
      "email": "founder@example.com",
      "phone": "+1234567890"
    },
    "location": "Main Library, 2nd Floor",
    "status": "available",
    "createdBy": {
      "_id": "...",
      "name": "...",
      "email": "..."
    }
  }
]
```

### Update Found Item Status
```http
PATCH /api/admin/found-items/:id
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "status": "claimed"
}
```

**Valid status values:** `available`, `pending_verification`, `claimed`

### Get All Users
```http
GET /api/admin/users
Authorization: Bearer <admin_token>
```

### Update User
```http
PATCH /api/admin/users/:id
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "Updated Name",
  "phone": "+9999999999",
  "role": "admin"
}
```

### Get All Verifications
```http
GET /api/admin/verifications
Authorization: Bearer <admin_token>
```

### Evaluate Verification
```http
PUT /api/admin/verifications/:id/evaluate
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "status": "passed",
  "similarityScore": 0.95
}
```

**Valid status values:** `pending`, `passed`, `failed`

---

## Error Responses

### 400 Bad Request
```json
{
  "message": "Validation error",
  "errors": ["Field X is required", "Field Y is invalid"]
}
```

### 401 Unauthorized
```json
{
  "message": "No token provided"
}
```

### 403 Forbidden
```json
{
  "message": "Forbidden: Admin access required"
}
```

### 404 Not Found
```json
{
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "message": "Internal server error",
  "stack": "..." // Only in development mode
}
```

---

## Data Models

### User
```typescript
{
  _id: ObjectId,
  firebaseUid: string,
  email: string,
  name?: string,
  phone?: string,
  role: 'owner' | 'founder' | 'admin',
  createdAt: Date,
  updatedAt: Date
}
```

### Found Item
```typescript
{
  _id: ObjectId,
  imageUrl: string,
  category: string,
  description: string,
  questions: string[],
  founderAnswers: string[],
  founderContact: {
    name: string,
    email: string,
    phone: string
  },
  location: string,
  status: 'available' | 'pending_verification' | 'claimed',
  createdBy?: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

### Lost Request
```typescript
{
  _id: ObjectId,
  ownerId: ObjectId,
  category: string,
  description: string,
  matchedFoundItemIds?: ObjectId[],
  createdAt: Date,
  updatedAt: Date
}
```

### Verification
```typescript
{
  _id: ObjectId,
  foundItemId: ObjectId,
  ownerId: ObjectId,
  questions: string[],
  founderAnswers: string[],
  ownerVideoAnswers: [
    {
      question: string,
      videoUrl: string
    }
  ],
  status: 'pending' | 'passed' | 'failed',
  similarityScore: number | null,
  createdAt: Date,
  updatedAt: Date
}
```
