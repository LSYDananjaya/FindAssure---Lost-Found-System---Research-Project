# FindAssure System Architecture

## Complete System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FINDASSURE SYSTEM                            │
│                    Lost & Found Research Project                     │
└─────────────────────────────────────────────────────────────────────┘

                              ┌─────────────┐
                              │  Firebase   │
                              │    Auth     │
                              └──────┬──────┘
                                     │
                        Email/Password Auth
                                     │
                              ┌──────▼──────┐
                              │   Mobile    │
                              │     App     │
                              │ React Native│
                              │    Expo     │
                              └──────┬──────┘
                                     │
                        HTTP Requests + Firebase Token
                                     │
┌────────────────────────────────────┼────────────────────────────────┐
│                                    │                                 │
│                          ┌─────────▼─────────┐                      │
│                          │   Express App     │                      │
│                          │   (app.ts)        │                      │
│                          └─────────┬─────────┘                      │
│                                    │                                 │
│                          ┌─────────▼─────────┐                      │
│                          │   Middleware      │                      │
│                          │  - CORS           │                      │
│                          │  - JSON Parser    │                      │
│                          │  - Auth Verify    │                      │
│                          │  - Error Handler  │                      │
│                          └─────────┬─────────┘                      │
│                                    │                                 │
│                    ┌───────────────┼───────────────┐                │
│                    │               │               │                │
│            ┌───────▼───────┐ ┌────▼─────┐ ┌──────▼──────┐         │
│            │  Auth Routes  │ │  Item    │ │   Admin     │         │
│            │  /api/auth    │ │  Routes  │ │   Routes    │         │
│            │               │ │/api/items│ │  /api/admin │         │
│            └───────┬───────┘ └────┬─────┘ └──────┬──────┘         │
│                    │               │               │                │
│            ┌───────▼───────┐ ┌────▼─────┐ ┌──────▼──────┐         │
│            │     Auth      │ │   Item   │ │    Admin    │         │
│            │  Controller   │ │Controller│ │  Controller │         │
│            └───────┬───────┘ └────┬─────┘ └──────┬──────┘         │
│                    │               │               │                │
│                    │      ┌────────▼────────┐      │                │
│                    │      │    Services     │      │                │
│                    │      │  - itemService  │      │                │
│                    │      │  - verification │      │                │
│                    │      └────────┬────────┘      │                │
│                    │               │               │                │
│                    └───────────────┼───────────────┘                │
│                                    │                                 │
│                          ┌─────────▼─────────┐                      │
│                          │  Mongoose Models  │                      │
│                          │  - User           │                      │
│                          │  - FoundItem      │                      │
│                          │  - LostRequest    │                      │
│                          │  - Verification   │                      │
│                          └─────────┬─────────┘                      │
│                                    │                                 │
│              BACKEND (Node.js + Express + TypeScript)               │
└────────────────────────────────────┼────────────────────────────────┘
                                     │
                          ┌──────────▼──────────┐
                          │      MongoDB        │
                          │    (Database)       │
                          │                     │
                          │  Collections:       │
                          │  - users            │
                          │  - founditems       │
                          │  - lostrequests     │
                          │  - verifications    │
                          └─────────────────────┘
```

## Data Flow Diagrams

### 1. User Authentication Flow

```
User (Mobile App)
      │
      │ 1. Sign Up/Login
      ▼
Firebase Auth
      │
      │ 2. Create Auth User
      │    Return Firebase Token
      ▼
User stores token
      │
      │ 3. API Request with Token
      │    Authorization: Bearer <token>
      ▼
Backend (authMiddleware)
      │
      │ 4. Verify Token with Firebase Admin SDK
      ▼
Firebase Admin SDK
      │
      │ 5. Token Valid → Extract UID & Email
      ▼
MongoDB (Find or Create User)
      │
      │ 6. User exists? 
      │    No → Create new User document
      │    Yes → Fetch existing User
      ▼
Request continues with req.user attached
```

### 2. Report Found Item Flow

```
Founder (Mobile App)
      │
      │ 1. Take photo, fill details
      │    - Image URL
      │    - Category, Description
      │    - Location ⭐
      │    - Security Questions
      │    - Text Answers
      │    - Contact Info
      ▼
POST /api/items/found
      │
      │ 2. Validate input
      ▼
itemController.createFoundItem
      │
      │ 3. Process data
      ▼
itemService.createFoundItem
      │
      │ 4. Create FoundItem
      ▼
MongoDB (founditems collection)
      │
      │ 5. Save document with:
      │    - questions: ["Q1", "Q2", ...]
      │    - founderAnswers: ["A1", "A2", ...] ⭐ STORED
      │    - location: "Library 2nd Floor" ⭐
      │    - status: "available"
      ▼
Return created item to founder
```

### 3. Owner Browse Items Flow

```
Owner (Mobile App)
      │
      │ 1. View found items list
      ▼
GET /api/items/found
      │
      │ 2. Fetch from database
      ▼
itemController.listFoundItems
      │
      │ 3. Get items
      ▼
itemService.listFoundItems
      │
      │ 4. Retrieve items
      ▼
MongoDB (founditems)
      │
      │ 5. Return items
      ▼
Controller removes founderAnswers ⭐
      │
      │ 6. Response to owner:
      │    {
      │      imageUrl, category, description,
      │      questions: ["Q1", "Q2"],
      │      location: "Library 2nd Floor",
      │      status: "available"
      │      // NO founderAnswers ⭐
      │    }
      ▼
Owner sees items (without answers)
```

### 4. Verification Flow

```
Owner (Mobile App)
      │
      │ 1. "This is my item!" 
      │    Record video answers
      │    - Question 1 → Video URL 1
      │    - Question 2 → Video URL 2
      ▼
POST /api/items/verification
Authorization: Bearer <token>
      │
      │ 2. Create verification
      ▼
itemController.createVerification
      │
      │ 3. Process
      ▼
verificationService.createVerification
      │
      │ 4. Fetch FoundItem
      ▼
MongoDB (founditems)
      │
      │ 5. Get founder's answers
      │    founderAnswers: ["A1", "A2"]
      ▼
Create Verification Document:
  {
    foundItemId: ObjectId,
    ownerId: ObjectId,
    questions: ["Q1", "Q2"],
    founderAnswers: ["A1", "A2"], ⭐ STORED
    ownerVideoAnswers: [
      { question: "Q1", videoUrl: "url1" },
      { question: "Q2", videoUrl: "url2" }
    ],
    status: "pending"
  }
      │
      │ 6. Save verification
      ▼
MongoDB (verifications)
      │
      │ 7. Update item status
      │    status → "pending_verification"
      ▼
MongoDB (founditems)
      │
      │ 8. Return verification (without founderAnswers)
      ▼
Owner receives confirmation
```

### 5. Admin Review Flow

```
Admin (Mobile App)
      │
      │ 1. View verifications
      ▼
GET /api/admin/verifications
Authorization: Bearer <admin_token>
      │
      │ 2. Check role
      ▼
requireAdmin middleware
      │
      │ 3. Role = admin? ✓
      ▼
adminController.getAllVerifications
      │
      │ 4. Fetch all verifications
      ▼
verificationService.getAllVerifications
      │
      │ 5. Get from database
      ▼
MongoDB (verifications)
      │
      │ 6. Return FULL details:
      │    {
      │      questions: ["Q1", "Q2"],
      │      founderAnswers: ["A1", "A2"], ⭐ VISIBLE
      │      ownerVideoAnswers: [
      │        { question: "Q1", videoUrl: "url1" },
      │        { question: "Q2", videoUrl: "url2" }
      │      ],
      │      status: "pending"
      │    }
      ▼
Admin reviews:
  - Watches owner's videos
  - Compares with founder's text answers
  - Decides: Pass or Fail
      │
      │ 7. Evaluate
      ▼
PUT /api/admin/verifications/:id/evaluate
      │
      │ 8. Update verification
      │    status: "passed" or "failed"
      │    similarityScore: 0.95 (optional)
      ▼
MongoDB (verifications)
      │
      │ 9. If passed, update item
      │    status → "claimed"
      ▼
MongoDB (founditems)
      │
      │ 10. Notify users (future)
      ▼
Complete!
```

## Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      SECURITY LAYERS                         │
└─────────────────────────────────────────────────────────────┘

Layer 1: Firebase Authentication
  ├─ Email/Password auth
  ├─ Token generation
  └─ Token refresh

Layer 2: Token Verification (Backend)
  ├─ Firebase Admin SDK verifies token
  ├─ Extract user UID
  └─ Find/Create user in MongoDB

Layer 3: Role-Based Access Control
  ├─ Owner role: Can report lost, view found items
  ├─ Founder role: Can report found items
  └─ Admin role: Full access to all data

Layer 4: Data Access Control
  ├─ Owner View: No founderAnswers ⭐
  ├─ Admin View: All data including founderAnswers ⭐
  └─ Service layer enforces rules

Layer 5: Input Validation
  ├─ Required fields check
  ├─ Data type validation
  └─ Business rule validation

Layer 6: Error Handling
  ├─ No internal details exposed
  ├─ Appropriate status codes
  └─ User-friendly messages
```

## Database Schema

```
┌──────────────────────────────────────────────────────────────┐
│                    MONGODB COLLECTIONS                        │
└──────────────────────────────────────────────────────────────┘

users
├─ _id: ObjectId (PK)
├─ firebaseUid: String (unique, indexed)
├─ email: String (unique, required)
├─ name: String
├─ phone: String
├─ role: "owner" | "founder" | "admin"
├─ createdAt: Date
└─ updatedAt: Date

founditems
├─ _id: ObjectId (PK)
├─ imageUrl: String
├─ category: String (indexed)
├─ description: String
├─ questions: [String]
├─ founderAnswers: [String] ⭐ SENSITIVE
├─ founderContact: {
│   ├─ name: String
│   ├─ email: String
│   └─ phone: String
│  }
├─ location: String ⭐ IMPORTANT
├─ status: "available" | "pending_verification" | "claimed" (indexed)
├─ createdBy: ObjectId (ref: users)
├─ createdAt: Date
└─ updatedAt: Date

lostrequests
├─ _id: ObjectId (PK)
├─ ownerId: ObjectId (ref: users, indexed)
├─ category: String
├─ description: String
├─ matchedFoundItemIds: [ObjectId] (ref: founditems)
├─ createdAt: Date
└─ updatedAt: Date

verifications
├─ _id: ObjectId (PK)
├─ foundItemId: ObjectId (ref: founditems, indexed)
├─ ownerId: ObjectId (ref: users, indexed)
├─ questions: [String]
├─ founderAnswers: [String] ⭐ SENSITIVE
├─ ownerVideoAnswers: [{
│   ├─ question: String
│   └─ videoUrl: String
│  }]
├─ status: "pending" | "passed" | "failed" (indexed)
├─ similarityScore: Number (null initially)
├─ createdAt: Date
└─ updatedAt: Date
```

## API Endpoint Map

```
┌─────────────────────────────────────────────────────────────┐
│                      API ENDPOINTS                           │
└─────────────────────────────────────────────────────────────┘

PUBLIC (No Auth Required)
├─ GET /health
├─ POST /api/items/found
├─ GET /api/items/found
└─ GET /api/items/found/:id (Owner view)

AUTHENTICATED (Bearer Token Required)
├─ Auth Endpoints
│  ├─ GET /api/auth/me
│  ├─ PATCH /api/auth/me
│  └─ POST /api/auth/register-extra
├─ Lost Items
│  ├─ POST /api/items/lost
│  └─ GET /api/items/lost/me
└─ Verification
   ├─ POST /api/items/verification
   ├─ GET /api/items/verification/:id
   └─ GET /api/items/verification/me

ADMIN ONLY (Bearer Token + Admin Role)
├─ Dashboard
│  └─ GET /api/admin/overview
├─ Found Items Management
│  ├─ GET /api/admin/found-items (Full details)
│  └─ PATCH /api/admin/found-items/:id
├─ User Management
│  ├─ GET /api/admin/users
│  └─ PATCH /api/admin/users/:id
└─ Verification Management
   ├─ GET /api/admin/verifications (Full details)
   └─ PUT /api/admin/verifications/:id/evaluate
```

## Technology Stack Visualization

```
┌─────────────────────────────────────────────────────────────┐
│                    TECHNOLOGY STACK                          │
└─────────────────────────────────────────────────────────────┘

Frontend (Mobile App)
├─ React Native
├─ Expo
├─ TypeScript
├─ Axios (HTTP Client)
└─ Firebase Auth SDK

Backend (API Server)
├─ Node.js (Runtime)
├─ Express (Web Framework)
├─ TypeScript (Language)
├─ Mongoose (ODM)
└─ Firebase Admin SDK (Auth Verification)

Database
└─ MongoDB (NoSQL Database)

Authentication
└─ Firebase Authentication

Development Tools
├─ ts-node-dev (Development Server)
├─ ESLint (Code Quality)
└─ Prettier (Code Formatting)

Deployment Options
├─ Railway
├─ Render
├─ Heroku
└─ AWS EC2
```

## File Structure Tree

```
Backend/
│
├── src/                           # Source code
│   ├── app.ts                     # Express app setup
│   ├── server.ts                  # Server entry point
│   │
│   ├── config/                    # Configuration
│   │   ├── db.ts                  # MongoDB connection
│   │   └── firebaseAdmin.ts       # Firebase Admin SDK
│   │
│   ├── middleware/                # Middleware
│   │   ├── authMiddleware.ts      # Auth & authorization
│   │   └── errorHandler.ts        # Error handling
│   │
│   ├── models/                    # Mongoose models
│   │   ├── User.ts                # User schema
│   │   ├── FoundItem.ts           # Found item schema
│   │   ├── LostRequest.ts         # Lost request schema
│   │   └── Verification.ts        # Verification schema
│   │
│   ├── controllers/               # Request handlers
│   │   ├── authController.ts      # Auth logic
│   │   ├── itemController.ts      # Item logic
│   │   └── adminController.ts     # Admin logic
│   │
│   ├── routes/                    # Route definitions
│   │   ├── authRoutes.ts          # Auth routes
│   │   ├── itemRoutes.ts          # Item routes
│   │   └── adminRoutes.ts         # Admin routes
│   │
│   ├── services/                  # Business logic
│   │   ├── itemService.ts         # Item operations
│   │   └── verificationService.ts # Verification operations
│   │
│   └── utils/                     # Utilities
│       └── types.ts               # Shared types
│
├── node_modules/                  # Dependencies
│
├── dist/                          # Compiled JavaScript (gitignored)
│
├── Documentation/                 # Project documentation
│   ├── README.md                  # Project overview
│   ├── SETUP_GUIDE.md            # Setup instructions
│   ├── API_DOCUMENTATION.md      # API reference
│   ├── TESTING_DEPLOYMENT.md     # Testing & deployment
│   ├── INTEGRATION_GUIDE.md      # Frontend integration
│   ├── QUICK_REFERENCE.md        # Quick commands
│   ├── COPILOT_BACKEND.md        # AI context
│   ├── IMPLEMENTATION_SUMMARY.md # Completion summary
│   ├── PROJECT_CHECKLIST.md      # Project checklist
│   └── ARCHITECTURE.md           # This file
│
├── .env                          # Environment variables (gitignored)
├── .env.example                  # Environment template
├── .gitignore                    # Git ignore rules
├── package.json                  # Dependencies & scripts
└── tsconfig.json                 # TypeScript configuration
```

## Component Interaction

```
┌────────────────────────────────────────────────────────────┐
│                   COMPONENT INTERACTION                     │
└────────────────────────────────────────────────────────────┘

Request Flow:
  Mobile App → Routes → Middleware → Controller → Service → Model → Database
  
Response Flow:
  Database → Model → Service → Controller → Middleware → Mobile App

Example: Create Found Item
  1. POST /api/items/found
  2. itemRoutes.ts receives request
  3. (No auth middleware for this endpoint)
  4. itemController.createFoundItem
  5. itemService.createFoundItem
  6. FoundItem.create()
  7. MongoDB saves document
  8. Return created item
  9. Response sent to mobile app

Example: Get My Profile
  1. GET /api/auth/me
  2. authRoutes.ts receives request
  3. requireAuth middleware:
     - Verify Firebase token
     - Find/create user in MongoDB
     - Attach req.user
  4. authController.getCurrentUser
  5. User.findById()
  6. MongoDB returns user
  7. Response sent to mobile app
```

## Security Data Flow

```
┌────────────────────────────────────────────────────────────┐
│              SECURITY & DATA PROTECTION                     │
└────────────────────────────────────────────────────────────┘

Founder's Answers Protection:
  
  When Founder Reports Item:
    MongoDB stores: founderAnswers = ["A1", "A2", "A3"]
  
  When Owner Views Item:
    itemService.getFoundItemForOwner(id)
    ├─ Fetch from MongoDB
    ├─ Remove founderAnswers field
    └─ Return: { ...item, founderAnswers: undefined }
  
  When Admin Views Item:
    itemService.getFoundItemForAdmin(id)
    ├─ Fetch from MongoDB
    └─ Return: { ...item, founderAnswers: ["A1", "A2", "A3"] }
  
  When Verification Created:
    verificationService.createVerification()
    ├─ Fetch FoundItem with founderAnswers
    ├─ Copy to Verification document
    └─ Store for future AI comparison

Role-Based Access:
  
  Owner (role: "owner"):
    ✓ Can report lost items
    ✓ Can view found items (without founder answers)
    ✓ Can submit verifications
    ✗ Cannot see founder's text answers
    ✗ Cannot access admin endpoints
  
  Founder (role: "founder"):
    ✓ Can report found items
    ✓ Can view found items list
    ✗ Cannot access admin endpoints
  
  Admin (role: "admin"):
    ✓ Can view all data
    ✓ Can see founder's answers
    ✓ Can manage users
    ✓ Can manage items
    ✓ Can review verifications
```

---

**This architecture provides:**
- ✅ Scalable structure
- ✅ Clear separation of concerns
- ✅ Strong security measures
- ✅ Data protection for sensitive information
- ✅ Role-based access control
- ✅ Clean code organization
- ✅ Easy to maintain and extend

**Ready for production deployment! 🚀**
