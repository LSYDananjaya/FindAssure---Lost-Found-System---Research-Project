# FindAssure - Smart Lost & Found System

> **AI-Powered Lost and Found Platform for University Campuses**  
> Connecting finders and owners through intelligent matching and video-based verification.

---

## 🎯 Project Overview

FindAssure is a comprehensive **Smart Lost and Found System** designed specifically for university campuses, with the **SLIIT Marakech Campus** (10-20 buildings) as the initial deployment target. This research project leverages cutting-edge AI, machine learning, and natural language processing to revolutionize how lost items are reunited with their rightful owners.

### 🎓 Research Context

**Institution:** SLIIT (Sri Lanka Institute of Information Technology)  
**Target Deployment:** Marakech Campus  
**Scope:** 10-20 building coverage with comprehensive floor-by-floor tracking  
**Phase:** Research & Development - Final Year Project  
**Project Type:** Lost and Found Management System with AI/ML Integration

### The Problem
Traditional lost and found systems face critical challenges:
- Manual item categorization and matching is time-consuming
- No reliable ownership verification leads to fraud
- Poor location tracking makes items hard to find
- Finders hesitate to report items due to privacy concerns
- Lack of fraud detection mechanisms

### Our Solution
An intelligent, multi-layered platform that:
- **Automatically categorizes** found items using AI image recognition (YOLOv8m, Florence-2, Gemini)
- **Generates smart verification questions** from uploaded item images
- **Matches lost requests** using NLP description matching, ML-based location algorithms
- **Verifies ownership** through video-based Q&A with dual-layer validation (NLP + Gemini API)
- **Detects fraud** by analyzing claim patterns, answer scores, and interaction behaviors
- **Protects finder privacy** - no mandatory login required for finders
- **Admin oversight** with comprehensive dashboard for user and item management

---

## ✨ Key Features

### 🎯 For Finders (Item Reporters)
- 📸 **AI-Powered Image Upload** - Upload item photo; system automatically identifies category and description using YOLOv8m and Florence-2 models
- 🤖 **Smart Question Generation** - AI generates 10 contextual verification questions based on item image analysis
- ✏️ **Question Selection** - Finder selects 5 questions they can answer by physically examining the item
- 📝 **Answer Recording** - Provide short, accurate answers to selected questions
- 📍 **Precise Location Tagging** - Building, floor, and room-level location tracking for found items
- 👤 **Finder Details** - Enter contact information to facilitate item handover
- 🔓 **Optional Login** - Finders can report items anonymously without mandatory registration
- ✅ **Quick Submission** - Streamlined process to encourage reporting

### 🔍 For Owners (Item Claimants)
- 🔎 **Smart Search Interface** - Search by category, description, and location with intuitive filters
- 💯 **Location Confidence** - Indicate certainty level about where item was lost (affects matching score)
- 🎯 **AI-Driven Matching** - System suggests most relevant items using:
  - NLP-based description similarity matching
  - Location-based scoring (building, floor, room proximity)
  - Machine learning algorithms for ranking
- 📋 **Ranked Results** - View matching items sorted by relevance score
- 🎥 **Video Verification** - Answer 5 security questions via 5-second video recordings
- 🔄 **Retake Option** - Review and retake videos before submission
- ✅ **Instant Validation** - Dual-layer answer verification (Local NLP + Gemini API)
- 📞 **Secure Handover** - Access finder contact details only after successful verification
- 📱 **Profile Management** - Track claimed items and handover status
- 🔐 **Mandatory Login** - Secure authentication required for owners

### 🛡️ For Administrators
- 👥 **User Management** - Monitor, manage, and moderate all registered users
- 📊 **Item Dashboard** - Comprehensive view of all found items, lost requests, and claims
- 📈 **Analytics & Reports** - System usage statistics and matching success rates
- 🚨 **Fraud Detection System** - Advanced monitoring for suspicious activities:
  - Low verification scores across multiple claims
  - Rapid switching between different items
  - Pattern of abandoned or failed claims
  - Abnormal interaction timing and behavior
  - Score anomalies indicating deceptive behavior
- ⚡ **User Actions** - Suspend, warn, or permanently ban fraudulent users
- 🔔 **Real-time Alerts** - Notifications for critical fraud detections
- 📧 **Communication Tools** - Contact users for verification or support
- 🔒 **System Configuration** - Manage thresholds, rules, and system parameters

---

## 🏗️ System Architecture

FindAssure employs a **microservices architecture** with specialized components for different functionalities:

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
├─────────────────────────┬───────────────────────────────────────┤
│   Mobile App (Expo)     │      Web App (React/Vite)             │
│   - iOS & Android       │      - Admin Dashboard                 │
│   - Finder Interface    │      - Web Interface                   │
│   - Owner Interface     │      - Analytics & Reports             │
└────────────┬────────────┴───────────────┬───────────────────────┘
             │                            │
             └────────────────┬───────────┘
                              │
                    ┌─────────▼──────────┐
                    │   Backend API      │
                    │  (Node.js/Express) │
                    │    TypeScript      │
                    └─────────┬──────────┘
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
┌─────────▼────────┐ ┌───────▼────────┐ ┌───────▼────────┐
│  Image Processing│ │  NLP/ML Service│ │   AI Services  │
│    Pipeline      │ │    (Python)    │ │  (Gemini API)  │
│ - YOLOv8m        │ │ - spaCy NLP    │ │ - Vision AI    │
│ - Florence-2     │ │ - Similarity   │ │ - Reasoning    │
│ - DINOv2         │ │ - Matching     │ │ - Validation   │
└──────────────────┘ └────────────────┘ └────────────────┘
          │                   │                   │
          └───────────────────┼───────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
┌─────────▼────────┐ ┌───────▼────────┐ ┌───────▼────────┐
│    MongoDB       │ │ Firebase Auth  │ │   Cloudinary   │
│  (Main Database) │ │ & Storage      │ │ (Media Storage)│
└──────────────────┘ └────────────────┘ └────────────────┘
```

### Technology Stack

| Component | Technologies | Purpose |
|-----------|-------------|---------|
| **Backend API** | Node.js 18+, Express.js, TypeScript | REST API, business logic, orchestration |
| **Mobile App** | React Native, Expo, TypeScript | Cross-platform iOS/Android application |
| **Web App** | React 18, TypeScript, Vite, TailwindCSS | Admin dashboard and web interface |
| **Image Processing** | Python 3.9+, FastAPI, YOLOv8m, Florence-2, DINOv2 | Object detection, recognition, feature extraction |
| **NLP/ML Service** | Python, Flask, spaCy, scikit-learn | Semantic matching, answer verification |
| **AI Integration** | Google Gemini Flash API, Gemini Vision | Advanced reasoning, validation, question generation |
| **Database** | MongoDB Atlas, Mongoose ODM | Document storage, user data, items, verifications |
| **Authentication** | Firebase Auth, Firebase Admin SDK | User authentication, authorization |
| **Media Storage** | Cloudinary, Firebase Storage | Image/video upload, storage, processing |
| **Location Services** | Custom algorithms | Building/floor/room matching and scoring |

---

## 🔄 Complete System Workflow

### 📤 1. Found Item Submission Workflow

```
┌─────────────────┐
│ Finder Finds    │
│   Lost Item     │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: Image Upload                                         │
│ • Finder takes photo of the item                            │
│ • Uploads to mobile/web app                                 │
│ • Image sent to Image Processing Pipeline                   │
└────────┬────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 2: AI Image Analysis                                    │
│ • YOLOv8m: Detects and classifies object                    │
│ • Florence-2: Generates detailed description, OCR, VQA      │
│ • DINOv2: Creates 768d semantic embedding                   │
│ • Gemini Vision: Extracts features, colors, defects         │
│ Result: Category + Description + Features                   │
└────────┬────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 3: AI Question Generation                               │
│ • System analyzes image features and description            │
│ • Gemini API generates 10 contextual questions              │
│ • Questions target: color, features, defects, attachments   │
│ • Questions displayed to finder                             │
└────────┬────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 4: Finder Question Selection & Answers                 │
│ • Finder reviews 10 generated questions                     │
│ • Selects 5 questions they can answer confidently           │
│ • Provides short text answers for each selected question    │
│ • Answers based on physical examination of the item         │
└────────┬────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 5: Location & Contact Details                          │
│ • Building selection (Campus map interface)                 │
│ • Floor selection                                           │
│ • Room/Area specification                                   │
│ • Finder contact details (name, phone, email)               │
│ • Optional: Finder can login or remain anonymous            │
└────────┬────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 6: Database Storage                                     │
│ • Item details saved to MongoDB                             │
│ • Image stored in Cloudinary                                │
│ • Questions + Answers encrypted and stored                  │
│ • Embedding stored for similarity search                    │
│ • Item marked as "Available" status                         │
└─────────────────────────────────────────────────────────────┘
```

### 🔍 2. Lost Item Search & Matching Workflow

```
┌─────────────────┐
│   Owner Loses   │
│      Item       │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: Owner Login & Search                                │
│ • Owner must login (mandatory authentication)               │
│ • Navigate to "Search Lost Item" section                    │
│ • Select item category from dropdown                        │
└────────┬────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 2: Description Entry                                    │
│ • Enter text description of lost item                       │
│   Example: "Black leather wallet with blue logo"            │
│ • System tokenizes and processes description                │
│ • NLP preprocessing for matching                            │
└────────┬────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 3: Location Entry                                       │
│ • Select building where item was lost                       │
│ • Select floor (if known)                                   │
│ • Select area/room (if known)                               │
│ • Set confidence level: 😞 Low / 😐 Medium / 😊 High       │
│ • Confidence affects matching weight                        │
└────────┬────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 4: AI-Powered Matching Engine                          │
│                                                             │
│ A) NLP Description Matching:                                │
│    • spaCy semantic similarity                              │
│    • Cosine similarity on embeddings                        │
│    • Keyword matching with weights                          │
│    • Score: 0-100%                                          │
│                                                             │
│ B) Location-Based Matching:                                 │
│    • Same building: +40 points                              │
│    • Same floor: +30 points                                 │
│    • Same room: +20 points                                  │
│    • Adjacent floor: +15 points                             │
│    • Confidence multiplier: High(1.0), Med(0.7), Low(0.4)  │
│    • Score: 0-100%                                          │
│                                                             │
│ C) Combined Score:                                          │
│    • Final Score = (Description × 0.6) + (Location × 0.4)  │
│    • Items ranked by final score                            │
└────────┬────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 5: Ranked Results Display                              │
│ • Top matching items shown in order                         │
│ • Each item shows:                                          │
│   - Item image and description                              │
│   - Match score percentage                                  │
│   - Location where found                                    │
│   - Date/time found                                         │
│   - "Claim This Item" button                                │
└─────────────────────────────────────────────────────────────┘
```

### ✅ 3. Ownership Verification Workflow

```
┌─────────────────┐
│  Owner Selects  │
│   Their Item    │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: Claim Initiation                                     │
│ • Owner clicks "Claim This Item"                            │
│ • System retrieves 5 verification questions                 │
│ • Questions set by finder during item submission            │
│ • Camera interface activated                                │
└────────┬────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 2: Video Answer Recording                              │
│ • For each question (5 total):                              │
│   1. Question displayed on screen                           │
│   2. Owner records 5-second video answer                    │
│   3. Owner can review and retake video                      │
│   4. Owner confirms and moves to next question              │
│ • All 5 videos collected                                    │
└────────┬────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 3: Video Submission & Processing                       │
│ • Videos uploaded to Cloudinary/Firebase                    │
│ • Backend extracts audio from each video                    │
│ • Speech-to-Text conversion (Gemini API)                    │
│ • Text answers extracted                                    │
└────────┬────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 4: Dual-Layer Answer Verification                      │
│                                                             │
│ Layer 1: Local NLP Checker (Python/spaCy)                  │
│ • Semantic similarity matching                              │
│ • Cosine similarity between answers                         │
│ • Synonym and paraphrase detection                          │
│ • Score per answer: 0-100%                                  │
│                                                             │
│ Layer 2: Gemini AI Checker                                  │
│ • Advanced contextual understanding                         │
│ • Handles variations and partial matches                    │
│ • Cross-validation with finder's answers                    │
│ • Score per answer: 0-100%                                  │
│                                                             │
│ Combined Scoring:                                           │
│ • Each answer: (NLP × 0.4) + (Gemini × 0.6)                │
│ • Overall: Average of 5 answer scores                       │
│ • Threshold: 70% = Verified, <70% = Failed                 │
└────────┬────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 5: Verification Result                                 │
│                                                             │
│ IF Score ≥ 70%: ✅ VERIFIED                                │
│ • "Ownership Confirmed!" message                            │
│ • Founder contact details revealed                          │
│ • Item marked as "Claimed"                                  │
│ • Owner profile updated with claimed item                   │
│ • Notification sent to founder                              │
│                                                             │
│ IF Score < 70%: ❌ FAILED                                   │
│ • "Verification Failed" message                             │
│ • Fraud detection system triggered                          │
│ • Claim attempt logged with score                           │
│ • Owner can retry after cooldown period                     │
└─────────────────────────────────────────────────────────────┘
```

### 🚨 4. Fraud Detection Workflow

```
┌─────────────────────────────────────────────────────────────┐
│ CONTINUOUS MONITORING SYSTEM                                 │
│ (Runs in background for all user activities)                │
└────────┬────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│ Fraud Detection Signals Tracked:                            │
│                                                             │
│ 1. Low Verification Scores                                  │
│    • Multiple claims with scores < 60%                      │
│    • Pattern of failed verifications                        │
│                                                             │
│ 2. Rapid Item Switching                                     │
│    • Claiming different items in short time                 │
│    • < 5 minutes between claims = suspicious                │
│                                                             │
│ 3. Abandoned Claims                                         │
│    • Starting but not completing verifications              │
│    • Multiple incomplete claim attempts                     │
│                                                             │
│ 4. Abnormal Interaction Patterns                            │
│    • Viewing many items quickly                             │
│    • Random claiming without reading details                │
│    • Unusual access times/frequency                         │
│                                                             │
│ 5. Score Anomalies                                          │
│    • Consistently scoring just below threshold              │
│    • Erratic score patterns across attempts                 │
└────────┬────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│ Fraud Score Calculation:                                     │
│ • Each signal weighted and accumulated                      │
│ • Fraud Score = Σ(Signal Weights × Occurrences)            │
│ • Thresholds:                                               │
│   - 0-30: Normal User (Green)                               │
│   - 31-60: Watch List (Yellow)                              │
│   - 61-100: High Risk (Red)                                 │
└────────┬────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│ Admin Alert & Action:                                        │
│ • High-risk users flagged in admin dashboard                │
│ • Detailed activity log provided                            │
│ • Admin actions available:                                  │
│   1. Send warning message                                   │
│   2. Temporary suspension (7-30 days)                       │
│   3. Permanent ban                                          │
│   4. Request additional verification                        │
│ • All actions logged and auditable                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Complete Repository Structure

```
FindAssure---Lost-Found-System---Research-Project/
│
├── 📄 README.md                          # This file - Complete project documentation
├── 📄 CORS_FIX_GUIDE.md                 # CORS configuration guide
│
├── 📂 Backend/                          # 🔧 Node.js/Express REST API Server
│   ├── 📄 package.json                  # Dependencies and scripts
│   ├── 📄 tsconfig.json                 # TypeScript configuration
│   ├── 📄 README.md                     # Backend setup instructions
│   ├── 📄 TESTING_DEPLOYMENT.md         # Deployment testing guide
│   ├── 🔧 test-connection.ps1           # Database connection test script
│   ├── 🔧 test-verification-flow.ps1    # Verification flow test script
│   │
│   └── 📂 src/                          # Source code
│       ├── 📄 app.ts                    # Express app configuration
│       ├── 📄 server.ts                 # Server entry point
│       │
│       ├── 📂 config/                   # Configuration files
│       │   ├── database.ts              # MongoDB connection config
│       │   ├── firebase.ts              # Firebase Admin SDK config
│       │   └── cloudinary.ts            # Cloudinary config
│       │
│       ├── 📂 controllers/              # Request handlers (business logic)
│       │   ├── authController.ts        # Authentication endpoints
│       │   ├── itemController.ts        # Found/Lost item CRUD
│       │   ├── verificationController.ts # Verification flow
│       │   ├── matchingController.ts    # Item matching logic
│       │   └── adminController.ts       # Admin operations
│       │
│       ├── 📂 models/                   # MongoDB Schemas (Mongoose)
│       │   ├── User.ts                  # User model (owner/finder/admin)
│       │   ├── FoundItem.ts             # Found items with questions
│       │   ├── LostRequest.ts           # Lost item requests
│       │   ├── Verification.ts          # Verification attempts & scores
│       │   ├── FraudAlert.ts            # Fraud detection records
│       │   └── ClaimedItem.ts           # Successfully claimed items
│       │
│       ├── 📂 services/                 # Business logic services
│       │   ├── geminiService.ts         # Google Gemini API integration
│       │   ├── imageProcessingService.ts # Image upload & processing
│       │   ├── videoProcessingService.ts # Video handling
│       │   ├── matchingService.ts       # NLP & location matching
│       │   ├── fraudDetectionService.ts # Fraud pattern analysis
│       │   └── notificationService.ts   # Alerts & notifications
│       │
│       ├── 📂 middleware/               # Express middleware
│       │   ├── authMiddleware.ts        # JWT/Firebase auth verification
│       │   ├── errorHandler.ts          # Global error handling
│       │   ├── validation.ts            # Request validation
│       │   └── rateLimiter.ts           # API rate limiting
│       │
│       ├── 📂 routes/                   # API route definitions
│       │   ├── authRoutes.ts            # /api/auth/*
│       │   ├── itemRoutes.ts            # /api/items/*
│       │   ├── verificationRoutes.ts    # /api/verification/*
│       │   ├── matchingRoutes.ts        # /api/matching/*
│       │   └── adminRoutes.ts           # /api/admin/*
│       │
│       ├── 📂 scripts/                  # Utility scripts
│       │   └── seedDatabase.ts          # Database seeding for testing
│       │
│       ├── 📂 utils/                    # Helper functions
│       │   ├── logger.ts                # Logging utility
│       │   ├── validators.ts            # Input validators
│       │   └── helpers.ts               # General helpers
│       │
│       └── 📂 constants/                # Constants & enums
│           ├── errorMessages.ts         # Error message constants
│           └── itemCategories.ts        # Item category definitions
│
├── 📂 FindAssure/                       # 📱 React Native Mobile Application (Expo)
│   ├── 📄 package.json                  # Mobile app dependencies
│   ├── 📄 app.json                      # Expo app configuration
│   ├── 📄 tsconfig.json                 # TypeScript config
│   ├── 📄 metro.config.js               # Metro bundler config
│   ├── 📄 eslint.config.js              # ESLint configuration
│   ├── 📄 README.md                     # Mobile app setup guide
│   ├── 📄 PROJECT_DOCUMENTATION.md      # Detailed project docs
│   ├── 📄 MOBILE_APP_ARCHITECTURE.md    # Architecture documentation
│   ├── 📄 NETWORK_CONFIG.md             # Network configuration
│   ├── 📄 QUICK_START.md                # Quick start guide
│   ├── 📄 COPILOT_FRONTEND.md           # Development guide
│   │
│   ├── 📂 app/                          # Main app screens (Expo Router)
│   │   ├── _layout.tsx                  # Root layout
│   │   ├── index.tsx                    # Home screen
│   │   ├── modal.tsx                    # Modal screens
│   │   └── 📂 (tabs)/                   # Tab navigation
│   │       ├── index.tsx                # Main tab
│   │       ├── explore.tsx              # Explore screen
│   │       └── profile.tsx              # Profile screen
│   │
│   ├── 📂 src/                          # Source code
│   │   ├── 📂 screens/                  # Screen components
│   │   │   ├── Auth/                    # Login, Register, ForgotPassword
│   │   │   ├── Finder/                  # Report item, Upload image, Questions
│   │   │   ├── Owner/                   # Search items, Claim, Video verification
│   │   │   └── Profile/                 # User profile, Claimed items, Settings
│   │   │
│   │   ├── 📂 components/               # Reusable UI components
│   │   │   ├── ItemCard.tsx             # Item display card
│   │   │   ├── VideoRecorder.tsx        # Video recording component
│   │   │   ├── LocationPicker.tsx       # Building/floor/room selector
│   │   │   ├── QuestionList.tsx         # Question display & selection
│   │   │   └── ...
│   │   │
│   │   ├── 📂 navigation/               # Navigation configuration
│   │   │   ├── AppNavigator.tsx         # Main navigator
│   │   │   ├── AuthNavigator.tsx        # Auth flow
│   │   │   └── TabNavigator.tsx         # Bottom tabs
│   │   │
│   │   ├── 📂 api/                      # API integration
│   │   │   ├── client.ts                # Axios configuration
│   │   │   ├── authApi.ts               # Auth endpoints
│   │   │   ├── itemApi.ts               # Item endpoints
│   │   │   └── verificationApi.ts       # Verification endpoints
│   │   │
│   │   ├── 📂 context/                  # React Context (State Management)
│   │   │   ├── AuthContext.tsx          # Authentication state
│   │   │   └── ItemContext.tsx          # Item state
│   │   │
│   │   ├── 📂 hooks/                    # Custom React hooks
│   │   │   ├── useAuth.ts               # Auth hook
│   │   │   ├── useCamera.ts             # Camera hook
│   │   │   └── useLocation.ts           # Location hook
│   │   │
│   │   └── 📂 utils/                    # Utilities
│   │       ├── constants.ts             # App constants
│   │       ├── validators.ts            # Input validation
│   │       └── helpers.ts               # Helper functions
│   │
│   ├── 📂 assets/                       # Static assets
│   │   └── 📂 images/                   # Images, icons, logos
│   │
│   ├── 📂 components/                   # Additional Expo components
│   │   ├── external-link.tsx
│   │   ├── haptic-tab.tsx
│   │   ├── hello-wave.tsx
│   │   └── parallax-scroll-view.tsx
│   │
│   ├── 📂 constants/                    # App constants
│   └── 📂 scripts/                      # Build & deployment scripts
│
├── 📂 WebApp/                           # 🌐 React Web Application (Admin Dashboard)
│   ├── 📄 package.json                  # Web app dependencies
│   ├── 📄 tsconfig.json                 # TypeScript config
│   ├── 📄 vite.config.ts                # Vite bundler config
│   ├── 📄 tailwind.config.js            # TailwindCSS config
│   ├── 📄 postcss.config.js             # PostCSS config
│   ├── 📄 eslint.config.js              # ESLint config
│   ├── 📄 index.html                    # HTML entry point
│   ├── 📄 README.md                     # Web app README
│   ├── 📄 WEB_README.md                 # Detailed web documentation
│   ├── 📄 QUICK_START.md                # Quick start guide
│   ├── 📄 FLOW_DIAGRAMS.md              # Flow diagrams
│   ├── 📄 IMPLEMENTATION_SUMMARY.md     # Implementation summary
│   │
│   ├── 📂 public/                       # Static assets
│   │   ├── logo.svg
│   │   └── favicon.ico
│   │
│   └── 📂 src/                          # Source code
│       ├── 📄 main.tsx                  # React entry point
│       ├── 📄 App.tsx                   # Root component
│       ├── 📄 index.css                 # Global styles
│       │
│       ├── 📂 pages/                    # Page components
│       │   ├── Dashboard.tsx            # Admin dashboard home
│       │   ├── Users.tsx                # User management
│       │   ├── Items.tsx                # Item management
│       │   ├── FraudAlerts.tsx          # Fraud detection alerts
│       │   ├── Analytics.tsx            # System analytics
│       │   └── Settings.tsx             # Admin settings
│       │
│       ├── 📂 components/               # UI components
│       │   ├── Sidebar.tsx              # Navigation sidebar
│       │   ├── Header.tsx               # Page header
│       │   ├── UserTable.tsx            # User data table
│       │   ├── ItemCard.tsx             # Item display card
│       │   ├── FraudAlert.tsx           # Fraud alert component
│       │   └── Charts/                  # Chart components
│       │
│       ├── 📂 services/                 # API services
│       │   ├── api.ts                   # Axios client
│       │   ├── authService.ts           # Admin authentication
│       │   ├── userService.ts           # User CRUD operations
│       │   ├── itemService.ts           # Item operations
│       │   └── fraudService.ts          # Fraud detection API
│       │
│       ├── 📂 context/                  # State management
│       │   ├── AuthContext.tsx          # Admin auth state
│       │   └── ThemeContext.tsx         # Theme state
│       │
│       ├── 📂 hooks/                    # Custom hooks
│       │   ├── useAuth.ts
│       │   ├── useUsers.ts
│       │   └── useItems.ts
│       │
│       ├── 📂 types/                    # TypeScript type definitions
│       │   ├── user.ts
│       │   ├── item.ts
│       │   └── fraud.ts
│       │
│       └── 📂 utils/                    # Utilities
│           ├── constants.ts
│           ├── formatters.ts
│           └── validators.ts
│
├── 📂 Image-Processing-&-Object-Recognition-Pipeline/  # 🖼️ AI Vision Service (FastAPI)
│   ├── 📄 requirements.txt              # Python dependencies
│   ├── 📄 run_server.py                 # Server startup script
│   ├── 📄 siamese_network.py            # Siamese network for re-identification
│   ├── 📄 OVERVIEW.md                   # Service overview documentation
│   │
│   ├── 📂 app/                          # FastAPI application
│   │   ├── 📄 main.py                   # FastAPI app entry point
│   │   │
│   │   ├── 📂 services/                 # AI/ML services
│   │   │   ├── unified_pipeline.py      # Main processing pipeline orchestrator
│   │   │   ├── yolo_service.py          # YOLOv8m object detection
│   │   │   ├── florence_service.py      # Florence-2 VLM analysis
│   │   │   ├── gemini_reasoner.py       # Gemini AI reasoning
│   │   │   └── dino_embedder.py         # DINOv2 feature extraction
│   │   │
│   │   ├── 📂 domain/                   # Domain logic
│   │   │   └── category_specs.py        # Category definitions & rules (SSOT)
│   │   │
│   │   └── 📂 models/                   # Pre-trained model files
│   │       ├── final_master_model.pt    # YOLOv8m trained model
│   │       └── florence2-base-ft/       # Florence-2 model files
│   │
│   └── 📂 groundingdino/                # GroundingDINO utilities
│       └── ...                          # Grounding utilities
│
├── 📂 Similarity_python/                # 🧠 NLP/ML Matching Service (Flask)
│   ├── 📄 app.py                        # Flask API server
│   ├── 📄 requirement.txt               # Python dependencies
│   ├── 📄 README.md                     # Service documentation
│   ├── 📄 CONFIDENCE_QUICK_REF.md       # Confidence scoring reference
│   ├── 📄 info.txt                      # Additional information
│   │
│   ├── 📄 local_nlp_checker.py          # spaCy NLP answer verification
│   ├── 📄 gemini_batch_checker.py       # Gemini API batch verification
│   ├── 📄 video_to_text.py              # Video speech-to-text conversion
│   │
│   ├── 📄 test_exact_match.py           # Test: Exact matching
│   ├── 📄 test_gemini_priority.py       # Test: Gemini priority logic
│   ├── 📄 test_zero_match_security.py   # Test: Zero-match security
│   ├── 📄 test.json                     # Test data
│   │
│   └── 📂 __pycache__/                  # Python cache
│
├── 📂 Sugestion_python/                 # 📍 Location Matching Service (Flask)
│   ├── 📄 app.py                        # Flask API server
│   ├── 📄 requirements.txt              # Python dependencies
│   ├── 📄 README.md                     # Service documentation
│   ├── 📄 test.json                     # Test data
│   │
│   ├── 📄 building_location_matcher.py  # Building-level matching algorithm
│   ├── 📄 ground_location_matcher.py    # Floor/room-level matching algorithm
│   │
│   ├── 📂 data/                         # Location data
│   │   ├── buildings.json               # Building definitions
│   │   ├── floors.json                  # Floor mappings
│   │   └── rooms.json                   # Room/area definitions
│   │
│   ├── 📂 doc/                          # Documentation
│   └── 📂 __pycache__/                  # Python cache
│
├── 📂 Suggestion_UI/                    # 💡 Suggestion Interface (React/Vite)
│   ├── 📄 package.json                  # Dependencies
│   ├── 📄 tsconfig.json                 # TypeScript config
│   ├── 📄 vite.config.ts                # Vite config
│   ├── 📄 tailwind.config.js            # TailwindCSS config
│   ├── 📄 postcss.config.js             # PostCSS config
│   ├── 📄 eslint.config.js              # ESLint config
│   ├── 📄 index.html                    # HTML entry
│   ├── 📄 README.md                     # README
│   ├── 📄 QUICK_START.md                # Quick start guide
│   ├── 📄 COMPLETE_SETUP_GUIDE.md       # Complete setup guide
│   │
│   ├── 📂 public/                       # Static assets
│   └── 📂 src/                          # Source code
│       ├── 📄 main.tsx                  # Entry point
│       ├── 📄 App.tsx                   # Root component
│       ├── 📂 components/               # UI components
│       ├── 📂 pages/                    # Page components
│       └── 📂 services/                 # API services
│
└── 📂 AI-Powered-Semantic-Machine-and-Data-Modeling-Engine/  # 🤖 Semantic Engine
    ├── 📂 app/                          # Application code
    │   ├── 📄 __init__.py
    │   ├── 📄 main.py                   # Main entry point
    │   ├── 📄 config.py                 # Configuration
    │   │
    │   ├── 📂 api/                      # API endpoints
    │   ├── 📂 core/                     # Core logic
    │   └── 📂 schemas/                  # Data schemas
    │
    ├── 📂 data/                         # Data storage
    │   ├── 📂 indices/                  # Search indices
    │   ├── 📂 models/                   # Trained models
    │   └── 📂 raw/                      # Raw data
    │
    ├── 📂 scripts/                      # Utility scripts
    │   ├── 📄 build_graph.py            # Knowledge graph builder
    │   ├── 📄 rebuild_index.py          # Index rebuilder
    │   ├── 📄 test_accuracy.py          # Accuracy testing
    │   ├── 📄 train_english_only.py     # English model training
    │   └── 📄 train_semantic.py         # Semantic model training
    │
    └── 📂 test/                         # Tests
        ├── 📄 __init__.py
        ├── 📄 test_api.py               # API tests
        └── 📄 test_core.py              # Core logic tests
```

### 📊 Component Overview

| Component | Type | Port | Purpose |
|-----------|------|------|---------|
| **Backend** | Node.js/Express API | 5001 | Main REST API, orchestration |
| **FindAssure** | React Native (Expo) | - | Mobile app (iOS/Android) |
| **WebApp** | React/Vite | 5173 | Admin dashboard |
| **Image Processing** | FastAPI (Python) | 8000 | AI vision pipeline |
| **Similarity** | Flask (Python) | 5000 | NLP answer verification |
| **Suggestion** | Flask (Python) | 5002 | Location matching |
| **Suggestion UI** | React/Vite | 3000 | Suggestion interface |
| **Semantic Engine** | Python | 8001 | Semantic modeling |

---

## 🚀 Getting Started - Complete Setup Guide

### System Requirements

#### Hardware Requirements
- **CPU:** 4+ cores recommended
- **RAM:** 16GB minimum (32GB recommended for AI services)
- **Storage:** 50GB+ free space
- **GPU:** Optional (CUDA-compatible GPU for faster AI processing)

#### Software Prerequisites
- **Node.js:** v18.0.0 or higher
- **npm:** v9.0.0 or higher
- **Python:** v3.9 or higher
- **MongoDB:** v6.0 or higher (Atlas or local)
- **Git:** Latest version

#### Required Accounts & API Keys
- **MongoDB Atlas** account (or local MongoDB)
- **Firebase** project with Authentication & Storage
- **Google Cloud** account for Gemini API
- **Cloudinary** account for media storage

---

### 📥 Installation Steps

#### Step 1: Clone Repository
```bash
# Clone the repository
git clone https://github.com/LSYDananjaya/FindAssure---Lost-Found-System---Research-Project.git

# Navigate to project directory
cd FindAssure---Lost-Found-System---Research-Project
```

#### Step 2: Backend Setup

```bash
# Navigate to Backend folder
cd Backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Edit .env with your credentials (see Environment Variables section below)

# Run in development mode
npm run dev

# Build for production
npm run build
npm start
```

**Backend Environment Variables (.env):**
```env
# Server Configuration
PORT=5001
NODE_ENV=development

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/findassure?retryWrites=true&w=majority

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYourKeyHere\n-----END PRIVATE KEY-----\n"

# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key_here

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# External Services
PYTHON_SIMILARITY_SERVICE_URL=http://localhost:5000
PYTHON_SUGGESTION_SERVICE_URL=http://localhost:5002
IMAGE_PROCESSING_SERVICE_URL=http://localhost:8000

# JWT Secret (if using JWT auth)
JWT_SECRET=your_jwt_secret_key_here

# CORS Origins (comma-separated)
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:19006
```

#### Step 3: Mobile App Setup (FindAssure)

```bash
# Navigate to FindAssure folder
cd FindAssure

# Install dependencies
npm install

# Create environment configuration
# Create file: src/config/environment.ts
# Add your API endpoints and Firebase config

# Start Expo development server
npm start

# Alternative commands:
npm run android    # Run on Android emulator
npm run ios        # Run on iOS simulator
npm run web        # Run on web browser
```

**Mobile App Configuration (src/config/environment.ts):**
```typescript
export const API_CONFIG = {
  BASE_URL: 'http://192.168.1.100:5001', // Replace with your machine's IP
  TIMEOUT: 30000,
};

export const FIREBASE_CONFIG = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};
```

#### Step 4: Web App Setup (Admin Dashboard)

```bash
# Navigate to WebApp folder
cd WebApp

# Install dependencies
npm install

# Create environment file
# Create file: .env
VITE_API_BASE_URL=http://localhost:5001
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id

# Start development server
npm run dev

# Build for production
npm run build
npm run preview  # Preview production build
```

#### Step 5: Image Processing Service Setup

```bash
# Navigate to Image Processing folder
cd Image-Processing-&-Object-Recognition-Pipeline

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Download model files (if not included)
# YOLOv8m, Florence-2, DINOv2 models should be in app/models/

# Create environment file
# Create file: .env
GEMINI_API_KEY=your_gemini_api_key

# Start FastAPI server
python run_server.py
# Server runs on http://localhost:8000
```

#### Step 6: Similarity Service Setup (NLP)

```bash
# Navigate to Similarity_python folder
cd Similarity_python

# Create virtual environment (if not already created)
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirement.txt

# Download spaCy language model
python -m spacy download en_core_web_lg

# Create environment file
# Create file: .env
GEMINI_API_KEY=your_gemini_api_key

# Start Flask server
python app.py
# Server runs on http://localhost:5000
```

#### Step 7: Suggestion Service Setup (Location Matching)

```bash
# Navigate to Sugestion_python folder
cd Sugestion_python

# Create virtual environment (if not already created)
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Ensure location data files exist in data/ folder
# - buildings.json
# - floors.json
# - rooms.json

# Start Flask server
python app.py
# Server runs on http://localhost:5002
```

---

### 🎬 Running the Complete System

**Terminal 1: Backend**
```bash
cd Backend
npm run dev
# ✅ Backend running on http://localhost:5001
```

**Terminal 2: Image Processing Service**
```bash
cd Image-Processing-&-Object-Recognition-Pipeline
venv\Scripts\activate  # or source venv/bin/activate
python run_server.py
# ✅ Vision API running on http://localhost:8000
```

**Terminal 3: Similarity Service**
```bash
cd Similarity_python
venv\Scripts\activate
python app.py
# ✅ NLP Service running on http://localhost:5000
```

**Terminal 4: Suggestion Service**
```bash
cd Sugestion_python
venv\Scripts\activate
python app.py
# ✅ Location Service running on http://localhost:5002
```

**Terminal 5: Web App**
```bash
cd WebApp
npm run dev
# ✅ Admin Dashboard running on http://localhost:5173
```

**Terminal 6: Mobile App**
```bash
cd FindAssure
npm start
# ✅ Expo Dev Server running
# Scan QR code with Expo Go app on your phone
```

### ✅ Verification Checklist

After setup, verify all services are running:

- [ ] Backend API: http://localhost:5001
- [ ] Image Processing: http://localhost:8000
- [ ] Similarity Service: http://localhost:5000
- [ ] Suggestion Service: http://localhost:5002
- [ ] Web App: http://localhost:5173
- [ ] Mobile App: Expo running
- [ ] MongoDB connected
- [ ] Firebase configured
- [ ] Gemini API working
- [ ] Cloudinary working

**Test Backend Health:**
```bash
curl http://localhost:5001/health
# Expected: {"status": "ok", "timestamp": "..."}
```

**Test Image Processing:**
```bash
curl http://localhost:8000/
# Expected: {"status": "Vision Core Backend is running"}
```

---

## 📊 Key Algorithms & Technical Details

### 🎯 1. AI Image Recognition Pipeline

**Multi-Model Architecture:**

```
Input Image
    │
    ├─► YOLOv8m Detection
    │   ├─ Object localization
    │   ├─ Class prediction
    │   └─ Confidence scores
    │
    ├─► Florence-2 VLM Analysis
    │   ├─ Caption generation
    │   ├─ OCR text extraction
    │   ├─ Visual Q&A (color, features)
    │   └─ Phrase grounding (defects, attachments)
    │
    ├─► Gemini Vision Reasoning
    │   ├─ High-level understanding
    │   ├─ Feature extraction
    │   ├─ Defect identification
    │   └─ Structured JSON output
    │
    └─► DINOv2 Embedding
        ├─ 768-dimensional feature vector
        ├─ 128-dimensional projection
        └─ Similarity search index
```

**Supported Item Categories:**
- Wallet
- Handbag
- Backpack
- Laptop
- Smart Phone
- Helmet
- Watch
- Keys
- ID Card
- Other

**Output Example:**
```json
{
  "category": "Wallet",
  "description": "Black leather wallet with worn edges",
  "features": {
    "color": "Black",
    "material": "Leather",
    "defects": ["Worn edges", "Scratched surface"],
    "attachments": ["Metal zipper"]
  },
  "embedding": [0.123, -0.456, ...],  // 768-dim
  "confidence": 0.94
}
```

---

### 🧠 2. NLP Description Matching Algorithm

**Semantic Similarity Scoring:**

```python
def calculate_description_match(lost_desc, found_desc):
    """
    Multi-layered description matching
    """
    # Layer 1: spaCy Semantic Similarity
    nlp = spacy.load("en_core_web_lg")
    doc1 = nlp(lost_desc)
    doc2 = nlp(found_desc)
    semantic_score = doc1.similarity(doc2) * 100
    
    # Layer 2: Keyword Matching
    lost_keywords = extract_keywords(lost_desc)
    found_keywords = extract_keywords(found_desc)
    keyword_score = jaccard_similarity(lost_keywords, found_keywords) * 100
    
    # Layer 3: TF-IDF Cosine Similarity
    vectorizer = TfidfVectorizer()
    tfidf_matrix = vectorizer.fit_transform([lost_desc, found_desc])
    tfidf_score = cosine_similarity(tfidf_matrix[0], tfidf_matrix[1])[0][0] * 100
    
    # Weighted combination
    final_score = (
        semantic_score * 0.5 +
        keyword_score * 0.3 +
        tfidf_score * 0.2
    )
    
    return min(final_score, 100)
```

**Scoring Interpretation:**
- **90-100%:** Excellent match (nearly identical descriptions)
- **75-89%:** Good match (similar items with minor differences)
- **60-74%:** Moderate match (same category, some shared features)
- **40-59%:** Weak match (some commonalities, worth reviewing)
- **< 40%:** Poor match (likely different items)

---

### 📍 3. Location-Based Matching Algorithm

**Hierarchical Location Scoring:**

```python
def calculate_location_score(lost_loc, found_loc, confidence):
    """
    Location matching with confidence weighting
    
    Args:
        lost_loc: {"building": "A", "floor": 2, "room": "205"}
        found_loc: {"building": "A", "floor": 3, "room": "301"}
        confidence: "high" | "medium" | "low"
    
    Returns:
        score: 0-100
    """
    base_score = 0
    
    # Building-level matching (highest priority)
    if lost_loc["building"] == found_loc["building"]:
        base_score += 40
        
        # Floor-level matching (if same building)
        if lost_loc["floor"] == found_loc["floor"]:
            base_score += 30
            
            # Room-level matching (if same floor)
            if lost_loc["room"] == found_loc["room"]:
                base_score += 20
        
        # Adjacent floor bonus
        elif abs(lost_loc["floor"] - found_loc["floor"]) == 1:
            base_score += 15
    
    # Different building but nearby
    elif buildings_are_adjacent(lost_loc["building"], found_loc["building"]):
        base_score += 10
    
    # Apply confidence multiplier
    confidence_multipliers = {
        "high": 1.0,    # 100% confidence
        "medium": 0.7,  # 70% confidence
        "low": 0.4      # 40% confidence
    }
    
    final_score = base_score * confidence_multipliers.get(confidence, 0.7)
    
    return min(final_score, 100)
```

**Location Matching Rules:**
1. **Same Building + Same Floor + Same Room** = 90-100% (Excellent)
2. **Same Building + Same Floor** = 70-80% (Very Good)
3. **Same Building + Adjacent Floor** = 55-65% (Good)
4. **Same Building + Different Floor** = 40-50% (Moderate)
5. **Adjacent Building** = 10-30% (Weak)
6. **Different Building** = 0-10% (Very Weak)

**Campus Layout Example:**
```
Building A ─ Connected ─ Building B
     │                        │
Connected                Connected
     │                        │
Building C ─ Connected ─ Building D
```

---

### 🔗 4. Combined Matching Score

**Final Ranking Algorithm:**

```python
def calculate_final_match_score(lost_request, found_item):
    """
    Combines description and location scores with weights
    """
    # Description similarity (60% weight)
    desc_score = calculate_description_match(
        lost_request["description"],
        found_item["description"]
    )
    
    # Location proximity (40% weight)
    loc_score = calculate_location_score(
        lost_request["location"],
        found_item["location"],
        lost_request["location_confidence"]
    )
    
    # Category exact match bonus (10 points)
    category_bonus = 10 if lost_request["category"] == found_item["category"] else 0
    
    # Recency bonus (newer items get slight boost)
    days_old = (datetime.now() - found_item["created_at"]).days
    recency_bonus = max(0, 5 - days_old)  # Max 5 points for items < 5 days old
    
    # Final weighted score
    final_score = (
        (desc_score * 0.60) +
        (loc_score * 0.40) +
        category_bonus +
        recency_bonus
    )
    
    return min(final_score, 100)
```

**Example Calculation:**
```
Lost Request: "Black leather wallet" at "Building A, Floor 2" (High confidence)
Found Item: "Dark wallet with cards" at "Building A, Floor 2, Room 205"

Description Score: 82% (good semantic match)
Location Score: 90% (same building & floor, high confidence)
Category Match: +10 (both "Wallet")
Recency: +3 (found 2 days ago)

Final Score = (82 × 0.6) + (90 × 0.4) + 10 + 3 = 98.2%
Result: Top-ranked match
```

---

### ✅ 5. Answer Verification Algorithm (Dual-Layer)

**Layer 1: Local NLP Verification (spaCy)**

```python
def verify_answer_nlp(founder_answer, owner_answer):
    """
    Local NLP-based answer verification using spaCy
    """
    nlp = spacy.load("en_core_web_lg")
    
    # Preprocess answers
    founder_doc = nlp(founder_answer.lower().strip())
    owner_doc = nlp(owner_answer.lower().strip())
    
    # 1. Semantic similarity
    semantic_sim = founder_doc.similarity(owner_doc) * 100
    
    # 2. Exact match check
    exact_match = 100 if founder_answer.lower() == owner_answer.lower() else 0
    
    # 3. Partial match (common tokens)
    founder_tokens = set([token.lemma_ for token in founder_doc if not token.is_stop])
    owner_tokens = set([token.lemma_ for token in owner_doc if not token.is_stop])
    partial_match = len(founder_tokens & owner_tokens) / max(len(founder_tokens), len(owner_tokens), 1) * 100
    
    # 4. Named entity matching (for specific details)
    founder_entities = set([ent.text.lower() for ent in founder_doc.ents])
    owner_entities = set([ent.text.lower() for ent in owner_doc.ents])
    entity_match = 100 if founder_entities == owner_entities and len(founder_entities) > 0 else 0
    
    # Weighted scoring
    nlp_score = (
        semantic_sim * 0.4 +
        exact_match * 0.3 +
        partial_match * 0.2 +
        entity_match * 0.1
    )
    
    return min(nlp_score, 100)
```

**Layer 2: Gemini AI Verification**

```python
def verify_answer_gemini(question, founder_answer, owner_answer):
    """
    Advanced AI verification using Google Gemini API
    """
    prompt = f"""
You are an expert answer verification system for a lost and found platform.

Question: {question}
Founder's Answer (Ground Truth): {founder_answer}
Owner's Answer (To Verify): {owner_answer}

Analyze both answers and determine if they refer to the same information.
Consider:
- Semantic equivalence (different words, same meaning)
- Partial matches (owner provides more or less detail)
- Synonyms and paraphrasing
- Context and intent

Provide a similarity score from 0-100, where:
- 100: Identical or perfectly equivalent answers
- 80-99: Very similar with minor differences
- 60-79: Moderately similar with some differences
- 40-59: Some overlap but significant differences
- 0-39: Different answers

Return ONLY a JSON object:
{{"score": <number>, "reasoning": "<brief explanation>"}}
"""
    
    response = gemini.generate_content(prompt)
    result = json.loads(response.text)
    
    return result["score"]
```

**Combined Verification Score:**

```python
def calculate_verification_score(questions_answers):
    """
    Combines NLP and Gemini scores for all 5 answers
    """
    total_score = 0
    
    for qa in questions_answers:
        nlp_score = verify_answer_nlp(qa["founder_answer"], qa["owner_answer"])
        gemini_score = verify_answer_gemini(qa["question"], qa["founder_answer"], qa["owner_answer"])
        
        # Weighted combination (Gemini has higher weight due to better context understanding)
        answer_score = (nlp_score * 0.4) + (gemini_score * 0.6)
        total_score += answer_score
    
    # Average across all 5 answers
    final_score = total_score / 5
    
    # Ownership threshold
    is_verified = final_score >= 70
    
    return {
        "score": round(final_score, 2),
        "verified": is_verified,
        "confidence": get_confidence_level(final_score)
    }

def get_confidence_level(score):
    if score >= 90:
        return "Very High"
    elif score >= 80:
        return "High"
    elif score >= 70:
        return "Medium (Verified)"
    elif score >= 60:
        return "Low (Not Verified)"
    else:
        return "Very Low (Not Verified)"
```

**Verification Example:**

```
Question: "What color is the wallet?"
Founder's Answer: "Black"
Owner's Answer: "It's black in color"

NLP Score: 95% (high semantic similarity)
Gemini Score: 98% (recognizes semantic equivalence)
Combined: (95 × 0.4) + (98 × 0.6) = 96.8%

Question: "How many cards were inside?"
Founder's Answer: "Three credit cards"
Owner's Answer: "3 cards"

NLP Score: 70% (different wording)
Gemini Score: 92% (understands "three" = "3", recognizes omission of "credit")
Combined: (70 × 0.4) + (92 × 0.6) = 83.2%

Average of 5 answers: 88.4%
Result: ✅ VERIFIED (score ≥ 70%)
```

---

### 🚨 6. Fraud Detection Algorithm

**Behavioral Analysis System:**

```python
class FraudDetector:
    def analyze_user_behavior(self, user_id):
        """
        Multi-factor fraud detection
        """
        user_activity = get_user_activity(user_id)
        fraud_score = 0
        signals = []
        
        # Signal 1: Low verification scores
        avg_verification_score = calculate_average_verification_score(user_id)
        if avg_verification_score < 60 and user_activity["total_claims"] > 3:
            fraud_score += 30
            signals.append("Consistently low verification scores")
        
        # Signal 2: Rapid item switching
        claim_timestamps = user_activity["claim_timestamps"]
        rapid_claims = count_claims_within_minutes(claim_timestamps, 5)
        if rapid_claims > 3:
            fraud_score += 25
            signals.append(f"Rapid claiming: {rapid_claims} items in <5 minutes")
        
        # Signal 3: Abandoned claims
        abandoned_ratio = user_activity["abandoned_claims"] / max(user_activity["total_claims"], 1)
        if abandoned_ratio > 0.5:
            fraud_score += 20
            signals.append(f"High abandonment rate: {abandoned_ratio:.0%}")
        
        # Signal 4: Failed verification pattern
        failed_verifications = user_activity["failed_verifications"]
        if failed_verifications > 5:
            fraud_score += 15
            signals.append(f"{failed_verifications} failed verifications")
        
        # Signal 5: Multiple items, same time period
        items_viewed_per_session = user_activity["items_viewed"] / max(user_activity["sessions"], 1)
        if items_viewed_per_session > 20:
            fraud_score += 10
            signals.append("Erratic browsing behavior")
        
        # Risk level determination
        if fraud_score >= 61:
            risk_level = "HIGH"
            action = "IMMEDIATE_REVIEW"
        elif fraud_score >= 31:
            risk_level = "MEDIUM"
            action = "WATCHLIST"
        else:
            risk_level = "LOW"
            action = "NORMAL"
        
        return {
            "user_id": user_id,
            "fraud_score": fraud_score,
            "risk_level": risk_level,
            "recommended_action": action,
            "detected_signals": signals,
            "timestamp": datetime.now()
        }
```

**Admin Alert System:**

```python
def trigger_fraud_alert(fraud_analysis):
    """
    Notifies admin dashboard of suspicious activity
    """
    if fraud_analysis["risk_level"] in ["HIGH", "MEDIUM"]:
        alert = {
            "type": "FRAUD_DETECTION",
            "severity": fraud_analysis["risk_level"],
            "user_id": fraud_analysis["user_id"],
            "score": fraud_analysis["fraud_score"],
            "signals": fraud_analysis["detected_signals"],
            "timestamp": fraud_analysis["timestamp"],
            "actions_available": [
                "Send Warning",
                "Temporary Suspension (7 days)",
                "Temporary Suspension (30 days)",
                "Permanent Ban",
                "Request Additional Verification"
            ]
        }
        
        # Send to admin dashboard
        broadcast_to_admin_dashboard(alert)
        
        # Log to database
        save_fraud_alert(alert)
        
        # Optional: Email notification to admin
        if fraud_analysis["risk_level"] == "HIGH":
            send_email_to_admin(alert)
```

**Fraud Score Interpretation:**
- **0-30 (Low Risk):** Normal user behavior
- **31-60 (Medium Risk):** Some suspicious patterns, monitor closely
- **61-100 (High Risk):** High likelihood of fraud, immediate action needed

---

## 📝 API Documentation

### Base URLs

| Service | URL | Description |
|---------|-----|-------------|
| Backend API | `http://localhost:5001` | Main REST API |
| Image Processing | `http://localhost:8000` | AI vision pipeline |
| Similarity Service | `http://localhost:5000` | NLP verification |
| Suggestion Service | `http://localhost:5002` | Location matching |

### Authentication

All authenticated endpoints require Firebase ID token in the Authorization header:

```http
Authorization: Bearer <firebase_id_token>
```

---

### 🔐 Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe",
  "phone": "+94771234567",
  "role": "owner" // or "finder" or "admin"
}

Response 201:
{
  "success": true,
  "user": {
    "uid": "firebase_user_id",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "owner"
  },
  "token": "firebase_id_token"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}

Response 200:
{
  "success": true,
  "user": { ... },
  "token": "firebase_id_token"
}
```

#### Get Profile
```http
GET /api/auth/profile
Authorization: Bearer <token>

Response 200:
{
  "success": true,
  "user": {
    "uid": "...",
    "email": "...",
    "name": "...",
    "claimed_items": [...],
    "reported_items": [...]
  }
}
```

---

### 📸 Found Item Endpoints

#### Submit Found Item
```http
POST /api/items/found
Authorization: Bearer <token> (optional for finders)
Content-Type: multipart/form-data

FormData:
- image: File (required)
- finderName: string
- finderPhone: string
- finderEmail: string
- building: string
- floor: number
- room: string

Response 201:
{
  "success": true,
  "item": {
    "id": "item_123",
    "category": "Wallet",
    "description": "Black leather wallet",
    "ai_generated_questions": [
      "What color is the wallet?",
      "How many cards were inside?",
      ...
    ],
    "location": { ... },
    "image_url": "https://cloudinary.com/...",
    "status": "pending_questions"
  }
}
```

#### Answer Questions for Found Item
```http
POST /api/items/found/:itemId/questions
Content-Type: application/json

{
  "selected_questions": [0, 2, 4, 6, 8],  // Indices of selected questions
  "answers": [
    { "question_index": 0, "answer": "Black" },
    { "question_index": 2, "answer": "Three credit cards" },
    ...
  ]
}

Response 200:
{
  "success": true,
  "item": {
    "id": "item_123",
    "status": "available",
    "verification_questions": [ ... ]
  }
}
```

#### Get All Found Items
```http
GET /api/items/found?page=1&limit=20&category=Wallet&status=available

Response 200:
{
  "success": true,
  "items": [ ... ],
  "pagination": {
    "total": 45,
    "page": 1,
    "pages": 3,
    "limit": 20
  }
}
```

#### Get Specific Found Item
```http
GET /api/items/found/:itemId

Response 200:
{
  "success": true,
  "item": {
    "id": "item_123",
    "category": "Wallet",
    "description": "...",
    "location": { ... },
    "image_url": "...",
    "created_at": "2026-01-09T10:30:00Z",
    "status": "available"
  }
}
```

---

### 🔍 Lost Item Request Endpoints

#### Create Lost Item Request
```http
POST /api/items/lost
Authorization: Bearer <token>
Content-Type: application/json

{
  "category": "Wallet",
  "description": "Black leather wallet with blue logo",
  "location": {
    "building": "A",
    "floor": 2,
    "room": "205"
  },
  "location_confidence": "high", // "high" | "medium" | "low"
  "lost_date": "2026-01-08T15:30:00Z"
}

Response 201:
{
  "success": true,
  "request": {
    "id": "request_456",
    "category": "Wallet",
    "description": "...",
    "status": "searching"
  }
}
```

#### Get Matching Items for Lost Request
```http
GET /api/items/matches/:requestId

Response 200:
{
  "success": true,
  "matches": [
    {
      "item": { ... },
      "match_score": 98.2,
      "description_score": 82,
      "location_score": 90,
      "breakdown": {
        "description": "Good semantic match",
        "location": "Same building and floor",
        "category": "Exact match"
      }
    },
    ...
  ],
  "request": { ... }
}
```

---

### ✅ Verification Endpoints

#### Initiate Claim (Get Questions)
```http
POST /api/verification/initiate
Authorization: Bearer <token>
Content-Type: application/json

{
  "item_id": "item_123",
  "request_id": "request_456"
}

Response 200:
{
  "success": true,
  "verification_id": "verify_789",
  "questions": [
    "What color is the wallet?",
    "How many cards were inside?",
    ...
  ]
}
```

#### Submit Video Answers
```http
POST /api/verification/:verificationId/submit
Authorization: Bearer <token>
Content-Type: multipart/form-data

FormData:
- video_1: File
- video_2: File
- video_3: File
- video_4: File
- video_5: File

Response 200:
{
  "success": true,
  "verification_id": "verify_789",
  "status": "processing"
}
```

#### Get Verification Result
```http
GET /api/verification/:verificationId/result
Authorization: Bearer <token>

Response 200:
{
  "success": true,
  "verification": {
    "id": "verify_789",
    "status": "completed",
    "overall_score": 88.4,
    "verified": true,
    "answer_scores": [
      { "question": "...", "score": 96.8 },
      { "question": "...", "score": 83.2 },
      ...
    ],
    "confidence": "High"
  },
  "founder_details": {
    "name": "Jane Smith",
    "phone": "+94771234567",
    "email": "jane@example.com"
  }
}
```

---

### 👑 Admin Endpoints

#### Get All Users
```http
GET /api/admin/users?page=1&limit=50&role=owner&status=active
Authorization: Bearer <admin_token>

Response 200:
{
  "success": true,
  "users": [ ... ],
  "pagination": { ... }
}
```

#### Get Fraud Alerts
```http
GET /api/admin/fraud-alerts?risk_level=HIGH&page=1
Authorization: Bearer <admin_token>

Response 200:
{
  "success": true,
  "alerts": [
    {
      "id": "alert_001",
      "user_id": "user_xyz",
      "fraud_score": 75,
      "risk_level": "HIGH",
      "signals": [
        "Consistently low verification scores",
        "Rapid claiming: 5 items in <5 minutes"
      ],
      "timestamp": "2026-01-09T14:20:00Z"
    },
    ...
  ]
}
```

#### Suspend User
```http
PUT /api/admin/users/:userId/suspend
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "duration_days": 30, // 0 for permanent ban
  "reason": "Fraudulent activity detected"
}

Response 200:
{
  "success": true,
  "user": {
    "uid": "user_xyz",
    "status": "suspended",
    "suspended_until": "2026-02-08T14:30:00Z"
  }
}
```

#### Get System Analytics
```http
GET /api/admin/analytics?start_date=2026-01-01&end_date=2026-01-31
Authorization: Bearer <admin_token>

Response 200:
{
  "success": true,
  "analytics": {
    "total_found_items": 234,
    "total_lost_requests": 189,
    "successful_matches": 156,
    "match_rate": 82.5,
    "avg_verification_score": 85.3,
    "fraud_alerts": 12,
    "active_users": 567
  }
}
```

---

### 🖼️ Image Processing Service

#### Analyze Image
```http
POST /pp1/analyze
Content-Type: multipart/form-data

FormData:
- image: File

Response 200:
{
  "success": true,
  "analysis": {
    "category": "Wallet",
    "description": "Black leather wallet with worn edges",
    "features": {
      "color": "Black",
      "material": "Leather",
      "defects": ["Worn edges"],
      "attachments": ["Metal zipper"]
    },
    "embedding": [...],
    "confidence": 0.94,
    "generated_questions": [
      "What color is the wallet?",
      "What material is the wallet made of?",
      ...
    ]
  }
}
```

---

### 🧠 NLP Similarity Service

#### Check Answer Similarity
```http
POST /api/verify-answers
Content-Type: application/json

{
  "questions_answers": [
    {
      "question": "What color is the wallet?",
      "founder_answer": "Black",
      "owner_answer": "It's black in color"
    },
    ...
  ]
}

Response 200:
{
  "success": true,
  "verification": {
    "overall_score": 88.4,
    "verified": true,
    "answer_scores": [
      {
        "question": "What color is the wallet?",
        "nlp_score": 95,
        "gemini_score": 98,
        "combined_score": 96.8
      },
      ...
    ]
  }
}
```

---

### 📍 Location Matching Service

#### Calculate Location Match
```http
POST /api/location/match
Content-Type: application/json

{
  "lost_location": {
    "building": "A",
    "floor": 2,
    "room": "205"
  },
  "found_location": {
    "building": "A",
    "floor": 3,
    "room": "301"
  },
  "confidence": "high"
}

Response 200:
{
  "success": true,
  "location_score": 55,
  "breakdown": {
    "building_match": true,
    "floor_match": false,
    "adjacent_floor": true,
    "base_score": 55,
    "confidence_multiplier": 1.0,
    "final_score": 55
  }
}
```

---

### Error Responses

All endpoints may return error responses in this format:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "email",
      "issue": "Email format is invalid"
    }
  }
}
```

**Common HTTP Status Codes:**
- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Missing or invalid authentication
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

---

## 🔀 Git Workflow & Development Guidelines

### Branch Structure

This project follows **GitHub Flow** for streamlined development:

```
main (production-ready code)
  ├── feature/ai-image-recognition
  ├── feature/video-verification
  ├── feature/fraud-detection
  ├── feature/admin-dashboard
  ├── bugfix/location-matching
  └── hotfix/authentication-error
```

### Workflow Rules

1. **Branch from `main`** - Always create new branches from the latest `main`
2. **Frequent commits** - Make small, logical commits with clear messages
3. **Pull Requests (PRs)** - All merges to `main` require PR approval
4. **Code reviews** - At least one team member must review before merging
5. **Clean history** - Squash commits when merging to maintain clean history

### Commit Message Guidelines

✅ **Good Commits:**
- `Added video verification flow`
- `Fixed location matching algorithm bug`
- `Refactored Gemini API service for better error handling`
- `Updated README with setup instructions`

❌ **Bad Commits:**
- `fixed stuff`
- `update`
- `changes`
- `test`

### Development Workflow

#### 1. Fork & Clone
```bash
# Fork the repository on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/FindAssure---Lost-Found-System---Research-Project.git
cd FindAssure---Lost-Found-System---Research-Project
git remote add upstream https://github.com/LSYDananjaya/FindAssure---Lost-Found-System---Research-Project.git
```

#### 2. Create Feature Branch
```bash
# Sync with upstream main
git checkout main
git pull upstream main

# Create and switch to new branch
git checkout -b feature/your-feature-name
```

#### 3. Make Changes & Commit
```bash
# Stage your changes
git add .

# Commit with clear message
git commit -m "Added email notification for item matches"

# Make frequent, small commits
git commit -m "Created email template"
git commit -m "Integrated SendGrid API"
git commit -m "Added unit tests for email service"
```

#### 4. Push & Create Pull Request
```bash
# Push to your fork
git push origin feature/your-feature-name

# Create PR on GitHub with:
# - Clear title and description
# - Screenshots/videos if UI changes
# - Link to related issues
# - Testing notes
```

#### 5. After PR Approval
```bash
# Sync with main
git checkout main
git pull upstream main

# Delete feature branch
git branch -d feature/your-feature-name
```

### 🧾 Merge History

| Date (Merged) | PR Link | Branch | Summary |
|---|---|---|---|
| 2026-01-09 | [#33](https://github.com/LSYDananjaya/FindAssure---Lost-Found-System---Research-Project/pull/33) | get-answers-from-video-capture-from-mobile | README documentation updated |
| 2026-01-09 | [#32](https://github.com/LSYDananjaya/FindAssure---Lost-Found-System---Research-Project/pull/32) | get-answers-from-video-capture-from-mobile | Fixed project file structure issues |
| 2026-01-07 | [#29](https://github.com/LSYDananjaya/FindAssure---Lost-Found-System---Research-Project/pull/29) | Image-Processing-&-Object-Recognition-Pipeline | Image processing and object recognition pipeline implemented |
| 2026-01-07 | [#28](https://github.com/LSYDananjaya/FindAssure---Lost-Found-System---Research-Project/pull/28) | get-answers-from-video-capture-from-mobile | Mobile video capture for ownership answers |
| 2026-01-07 | [#27](https://github.com/LSYDananjaya/FindAssure---Lost-Found-System---Research-Project/pull/27) | get-answers-from-video-capture-from-mobile | Mobile video capture for ownership answers |
| 2026-01-06 | [#26](https://github.com/LSYDananjaya/FindAssure---Lost-Found-System---Research-Project/pull/26) | Suggestion_UI | Added confidence stages with emoji indicators |
| 2026-01-05 | [#25](https://github.com/LSYDananjaya/FindAssure---Lost-Found-System---Research-Project/pull/25) | question-answers-similiraity-check---fix-accuracy-logic | Improved question–answer similarity accuracy |
| 2026-01-05 | [#24](https://github.com/LSYDananjaya/FindAssure---Lost-Found-System---Research-Project/pull/24) | Suggestion_UI | Added detailed system documentation |
| 2026-01-05 | [#23](https://github.com/LSYDananjaya/FindAssure---Lost-Found-System---Research-Project/pull/23) | Suggestion_UI | Implemented suggestion user interface |
| 2026-01-05 | [#22](https://github.com/LSYDananjaya/FindAssure---Lost-Found-System---Research-Project/pull/22) | Suggestion_UI | Enhanced similarity input page with location picker |
| 2026-01-05 | [#21](https://github.com/LSYDananjaya/FindAssure---Lost-Found-System---Research-Project/pull/21) | question-answers-similiraity-check---fix-accuracy-logic | Mobile application improvements |
| 2026-01-05 | [#20](https://github.com/LSYDananjaya/FindAssure---Lost-Found-System---Research-Project/pull/20) | question-answers-similiraity-check---fix-accuracy-logic | Implemented claimed item display |
| 2026-01-05 | [#19](https://github.com/LSYDananjaya/FindAssure---Lost-Found-System---Research-Project/pull/19) | question-answers-similiraity-check---fix-accuracy-logic | Enhanced ownership calculation logic |
| 2026-01-05 | [#18](https://github.com/LSYDananjaya/FindAssure---Lost-Found-System---Research-Project/pull/18) | Secure-Handover | Implemented founder detail display after verification |
| 2026-01-04 | [#17](https://github.com/LSYDananjaya/FindAssure---Lost-Found-System---Research-Project/pull/17) | Secure-Handover | Improved web interface |
| 2026-01-03 | [#16](https://github.com/LSYDananjaya/FindAssure---Lost-Found-System---Research-Project/pull/16) | Suggestion_UI | Suggestion UI improvements |
| 2026-01-03 | [#15](https://github.com/LSYDananjaya/FindAssure---Lost-Found-System---Research-Project/pull/15) | Suggestion_UI | Suggestion UI enhancements |
| 2026-01-03 | [#14](https://github.com/LSYDananjaya/FindAssure---Lost-Found-System---Research-Project/pull/14) | Secure-Handover | Enhanced secure handover web UI |
| 2026-01-03 | [#13](https://github.com/LSYDananjaya/FindAssure---Lost-Found-System---Research-Project/pull/13) | Secure-Handover | Secure handover web interface implemented |
| 2025-12-31 | [#12](https://github.com/LSYDananjaya/FindAssure---Lost-Found-System---Research-Project/pull/12) | FindAssure-Dev | Initial FindAssure development branch merged |
| 2025-12-31 | [#11](https://github.com/LSYDananjaya/FindAssure---Lost-Found-System---Research-Project/pull/11) | AI-Powered-Semantic-Machine-and-Data-Modeling-Engine | AI-powered semantic modeling engine implemented |
| 2025-12-25 | [#10](https://github.com/LSYDananjaya/FindAssure---Lost-Found-System---Research-Project/pull/10) | Secure-Handover | Secure handover functionality |
| 2025-12-24 | [#9](https://github.com/LSYDananjaya/FindAssure---Lost-Found-System---Research-Project/pull/9) | Image-Processing-&-Object-Recognition-Pipeline | Unified image analysis pipeline service |
| 2025-12-24 | [#8](https://github.com/LSYDananjaya/FindAssure---Lost-Found-System---Research-Project/pull/8) | Image-Processing-&-Object-Recognition-Pipeline | Gemini-based evidence extraction service |
| 2025-12-24 | [#7](https://github.com/LSYDananjaya/FindAssure---Lost-Found-System---Research-Project/pull/7) | Image-Processing-&-Object-Recognition-Pipeline | Image processing and recognition pipeline |
| 2025-12-23 | [#6](https://github.com/LSYDananjaya/FindAssure---Lost-Found-System---Research-Project/pull/6) | Image-Processing-&-Object-Recognition-Pipeline | Image processing and recognition pipeline |
| 2025-12-23 | [#5](https://github.com/LSYDananjaya/FindAssure---Lost-Found-System---Research-Project/pull/5) | Image-Processing-&-Object-Recognition-Pipeline | FastAPI backend and vision pipeline initialized |
| 2025-12-23 | [#4](https://github.com/LSYDananjaya/FindAssure---Lost-Found-System---Research-Project/pull/4) | Image-Processing-&-Object-Recognition-Pipeline | Project structure initialized |
| 2025-12-20 | [#3](https://github.com/LSYDananjaya/FindAssure---Lost-Found-System---Research-Project/pull/3) | Secure-Handover | Secure handover feature |
| 2025-12-04 | [#2](https://github.com/LSYDananjaya/FindAssure---Lost-Found-System---Research-Project/pull/2) | Secure-Handover | Secure handover feature |
| 2025-12-03 | [#1](https://github.com/LSYDananjaya/FindAssure---Lost-Found-System---Research-Project/pull/1) | Secure-Handover | Secure handover feature |

*[View all PRs](https://github.com/LSYDananjaya/FindAssure---Lost-Found-System---Research-Project/pulls?q=is%3Apr+is%3Amerged)*

---

## 🧪 Testing

### Backend Tests

```bash
cd Backend
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

### Frontend Tests

```bash
cd WebApp
npm test

cd FindAssure
npm test
```

### Python Service Tests

```bash
cd Similarity_python
pytest                    # Run all tests
pytest -v                 # Verbose mode
pytest test_exact_match.py # Specific test

cd Sugestion_python
pytest
```

### Integration Testing

```bash
# Test complete flow
cd Backend
npm run test:integration
```

---

## 🚀 Deployment

### Production Checklist

- [ ] Environment variables configured for production
- [ ] Database migrations completed
- [ ] All API keys secured (not in code)
- [ ] CORS origins updated for production domains
- [ ] Firebase authentication configured
- [ ] Cloudinary production account set up
- [ ] SSL certificates installed
- [ ] Load testing completed
- [ ] Security audit passed
- [ ] Backup strategy implemented

### Deployment Platforms

**Backend API:**
- Recommended: Railway, Render, or AWS EC2
- Database: MongoDB Atlas (Production cluster)

**Mobile App:**
- Build: `cd FindAssure && eas build --platform all`
- Deploy: Expo Application Services (EAS) or standalone builds

**Web App:**
- Build: `cd WebApp && npm run build`
- Deploy: Vercel, Netlify, or Cloudflare Pages

**Python Services:**
- Recommended: AWS Lambda, Google Cloud Run, or dedicated VPS

---

## 🐛 Troubleshooting

### Common Issues

#### Backend won't start
```bash
# Check MongoDB connection
mongo --version

# Verify environment variables
cat Backend/.env

# Clear node_modules and reinstall
cd Backend
rm -rf node_modules package-lock.json
npm install
```

#### Mobile app not connecting to backend
```bash
# Check API URL in config
# Use your computer's IP address, not localhost
ipconfig  # Windows
ifconfig  # macOS/Linux

# Update src/config/environment.ts with your IP
```

#### Python service errors
```bash
# Reinstall dependencies
pip install --upgrade -r requirements.txt

# Check Python version
python --version  # Should be 3.9+

# Download spaCy model
python -m spacy download en_core_web_lg
```

#### CORS errors in browser
```bash
# Update ALLOWED_ORIGINS in Backend/.env
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:19006

# Restart backend server
```

---





## 📄 License

This project is developed as part of a Final Year Research Project at SLIIT (Sri Lanka Institute of Information Technology). All rights reserved.

For academic use or collaboration inquiries, please contact the project team.

---

## 🙏 Acknowledgments

### Technologies & APIs

- **Google Gemini API** - Advanced AI reasoning and vision capabilities
- **Firebase** - Authentication and storage infrastructure
- **MongoDB Atlas** - Database hosting
- **Cloudinary** - Media storage and processing
- **spaCy** - Natural language processing
- **YOLOv8** - Object detection
- **Florence-2** - Vision-language model
- **DINOv2** - Feature extraction
- **Expo** - Mobile development platform
- **React & Vite** - Frontend frameworks

### Inspiration & Research

- University campus lost and found systems
- AI-powered verification systems
- Fraud detection in digital platforms
- Mobile-first application design

---



<div align="center">

## ⭐ Star this repository if you find it helpful!

**Made with ❤️ by the FindAssure Team**

**SLIIT Final Year Research Project 2025/2026**

[Report Bug](https://github.com/LSYDananjaya/FindAssure---Lost-Found-System---Research-Project/issues) • [Request Feature](https://github.com/LSYDananjaya/FindAssure---Lost-Found-System---Research-Project/issues) 

</div>








