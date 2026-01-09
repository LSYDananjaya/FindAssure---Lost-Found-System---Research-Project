# FindAssure - Smart Lost & Found System

> **AI-Powered Lost and Found Platform for University Campuses**  
> Connecting finders and owners through intelligent matching and video-based verification.

---

## 🎯 Overview

FindAssure is an intelligent lost and found system designed for university campuses (initially targeting SLIIT Marakech campus with 10-20 buildings). The system uses AI-driven image recognition, natural language processing, and location-based matching to reunite owners with their lost items through a secure verification process.

### The Problem
Traditional lost and found systems rely on manual matching and lack proper ownership verification, leading to fraud and inefficiency.

### Our Solution
An intelligent platform that:
- **Automatically categorizes** found items using AI image recognition
- **Generates verification questions** from item images
- **Matches lost requests** using description, location, and ML algorithms
- **Verifies ownership** through video-based Q&A with NLP validation
- **Detects fraud** by analyzing claim patterns and interaction behaviors
- **Protects finder privacy** - no mandatory login required for finders

---

## ✨ Key Features

### For Finders
- 📸 **Image Upload & AI Recognition** - Upload item photo; system identifies category and description
- 🤖 **AI-Generated Questions** - System creates 10 verification questions; finder selects 5 to answer
- 📍 **Location Tagging** - Building, floor, and room-level location tracking
- 🔓 **Anonymous Option** - Optional login for finders

### For Owners (Claimants)
- 🔍 **Smart Search** - Search by category, description, and location with confidence levels
- 🎯 **ML-Based Matching** - Intelligent ranking using NLP + location algorithms
- 🎥 **Video Verification** - Answer 5 questions via 5-second videos
- ✅ **Instant Validation** - Real-time answer checking with NLP + Gemini API

### For Administrators
- 👥 **User Management** - Monitor and manage all users
- 📊 **Item Dashboard** - View all lost and found items
- 🚨 **Fraud Detection** - Track suspicious patterns (rapid claims, low scores, erratic behavior)
- 🔨 **Action Controls** - Suspend or permanently ban fraudulent users

---

## 🏗️ Architecture

The system consists of four main components:

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Mobile App    │────▶│   Backend API    │◀────│    Web App      │
│  (FindAssure)   │     │   (Node.js/TS)   │     │  (React/Vite)   │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌──────────────────┐
                        │  Python Service  │
                        │  (NLP Matching)  │
                        └──────────────────┘
                               │
                        ┌──────────────────┐
                        │    Databases     │
                        │ MongoDB+Firebase │
                        └──────────────────┘
```

### Tech Stack

| Component | Technologies |
|-----------|-------------|
| **Backend** | Node.js, Express, TypeScript, MongoDB, Firebase Admin |
| **Mobile App** | React Native (Expo), TypeScript |
| **Web App** | React, TypeScript, Vite |
| **AI/ML Service** | Python, Flask, spaCy, NLP, Google Gemini API |
| **Storage** | Cloudinary (images/videos), Firebase Storage |
| **Authentication** | Firebase Auth |

---

## 🔄 System Workflow

### 1️⃣ Found Item Submission
```
Image Upload → AI Recognition → AI Question Generation → Finder Selection (5/10) 
→ Answer Submission → Location Entry → Database Storage
```

### 2️⃣ Lost Item Search & Matching
```
Owner Search (category + description + location + confidence) 
→ NLP Description Matching → Location-Based Matching (building/floor/room)
→ ML Score Calculation → Ranked Results Display
```

### 3️⃣ Ownership Verification
```
Owner Selects Item → Video Q&A (5 questions × 5 seconds) 
→ Audio Extraction → Speech-to-Text → NLP + Gemini Validation 
→ Score Calculation → Ownership Confirmation
```

### 4️⃣ Fraud Detection
```
Monitor: Answer Scores + Interaction Patterns + Rapid Claims 
→ Pattern Analysis → Fraud Score → Admin Alert → User Action
```

---

## 📁 Project Structure

```
Lost_Found/
├── Backend/              # Node.js/Express REST API
│   ├── src/
│   │   ├── controllers/  # Request handlers
│   │   ├── models/       # Database schemas (User, FoundItem, LostRequest, Verification)
│   │   ├── services/     # Business logic (Gemini, video processing)
│   │   ├── middleware/   # Auth & error handling
│   │   └── routes/       # API endpoints
│   └── package.json
│
├── FindAssure/           # React Native mobile application
│   ├── src/
│   │   ├── screens/      # UI screens
│   │   ├── components/   # Reusable components
│   │   ├── api/          # API client
│   │   └── navigation/   # App navigation
│   └── package.json
│
├── WebApp/               # React web application
│   ├── src/
│   │   ├── pages/        # Page components
│   │   ├── components/   # UI components
│   │   ├── services/     # API services
│   │   └── context/      # State management
│   └── package.json
│
└── Similarity_python/    # Python NLP/ML service
    ├── app.py            # Flask API
    ├── local_nlp_checker.py   # Answer validation
    ├── gemini_batch_checker.py # AI validation
    └── requirement.txt
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ & npm
- Python 3.9+
- MongoDB instance
- Firebase project
- Google Gemini API key
- Cloudinary account

### Installation

#### 1. Clone Repository
```bash
git clone <repository-url>
cd Lost_Found
```

#### 2. Backend Setup
```bash
cd Backend
npm install
# Create .env file with required credentials
npm run dev
```

#### 3. Python Service Setup
```bash
cd Similarity_python
pip install -r requirement.txt
python app.py
```

#### 4. Mobile App Setup
```bash
cd FindAssure
npm install
npm start
```

#### 5. Web App Setup
```bash
cd WebApp
npm install
npm run dev
```

### Environment Variables

**Backend (.env)**
```env
MONGODB_URI=your_mongodb_uri
FIREBASE_CREDENTIALS=your_firebase_admin_sdk
GEMINI_API_KEY=your_gemini_api_key
CLOUDINARY_URL=your_cloudinary_url
PYTHON_SERVICE_URL=http://localhost:5000
PORT=5001
```

**Mobile/Web Apps**
- Configure API URLs in respective config files
- Set up Firebase client configuration

---

## 📊 Key Algorithms

### Location Matching Algorithm
- **Building-level matching** (highest priority)
- **Floor-level matching** (medium priority)
- **Room/area matching** (fine-grained)
- **Confidence weighting** - User's location certainty affects scoring
- **Distance calculation** - Spatial proximity between found and lost locations

### Answer Verification (Dual-Layer)
1. **Local NLP Checker** - spaCy-based semantic similarity
2. **Gemini API Checker** - Advanced AI validation
3. **Combined scoring** - Weighted average for final decision

### Fraud Detection Signals
- Low verification scores across multiple claims
- Rapid switching between different items
- Pattern of abandoned claims
- Abnormal interaction timing
- Score anomalies

---

## 🎓 Research Context

**Institution:** SLIIT (Sri Lanka Institute of Information Technology)  
**Target Deployment:** Marakech Campus  
**Scope:** 10-20 building coverage with floor-by-floor tracking  
**Phase:** Research & Development

---

## 📝 API Documentation

### Core Endpoints

**Authentication**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

**Found Items**
- `POST /api/items/found` - Submit found item (with image)
- `GET /api/items/found` - List all found items
- `GET /api/items/found/:id` - Get specific item

**Lost Requests**
- `POST /api/items/lost` - Create lost item request
- `GET /api/items/matches/:requestId` - Get matching items

**Verification**
- `POST /api/verification/submit` - Submit video answers
- `GET /api/verification/:id` - Get verification result

**Admin**
- `GET /api/admin/users` - List all users
- `GET /api/admin/fraud-alerts` - Get fraud detections
- `PUT /api/admin/users/:id/suspend` - Suspend user

---

## 🔀 Git Workflow & Branching Strategy

This project follows **GitHub Flow** for streamlined development and deployment.

### Branch Structure

```
main (production-ready code)
  ├── feature/ai-image-recognition
  ├── feature/video-verification
  ├── feature/fraud-detection
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

### 🧾 Merge Records 



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


---

## 🛠️ Development Workflow

### Setting Up Development Environment

#### 1. Fork & Clone
```bash
# Fork the repository on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/Lost_Found.git
cd Lost_Found
git remote add upstream https://github.com/ORIGINAL_REPO/Lost_Found.git
```

#### 2. Create Feature Branch
```bash
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

### Running in Development Mode

**Terminal 1: Backend**
```bash
cd Backend
npm run dev
# Runs on http://localhost:5001
```

**Terminal 2: Python Service**
```bash
cd Similarity_python
python app.py
# Runs on http://localhost:5000
```

**Terminal 3: Web App**
```bash
cd WebApp
npm run dev
# Runs on http://localhost:5173
```

**Terminal 4: Mobile App**
```bash
cd FindAssure
npm start
# Scan QR code with Expo Go app
```

### Testing Changes

```bash
# Backend tests
cd Backend
npm test

# Web app tests
cd WebApp
npm run test

# Python service tests
cd Similarity_python
pytest
```

---

## 📋 Repository Structure Explanation

### Backend Component
- **Purpose:** REST API server handling all business logic
- **Key Files:** 
  - [src/app.ts](Backend/src/app.ts) - Express app configuration
  - [src/server.ts](Backend/src/server.ts) - Server entry point
  - [src/controllers/](Backend/src/controllers/) - Request handlers
  - [src/models/](Backend/src/models/) - MongoDB schemas
  - [src/services/geminiService.ts](Backend/src/services/geminiService.ts) - AI integration
- **Port:** 5001
- **Database:** MongoDB Atlas

### FindAssure (Mobile App)
- **Purpose:** React Native mobile application for finders and owners
- **Key Files:**
  - [src/screens/](FindAssure/src/screens/) - All app screens
  - [src/api/](FindAssure/src/api/) - API client configuration
  - [src/navigation/](FindAssure/src/navigation/) - App routing
- **Platform:** iOS & Android (Expo)
- **State Management:** Context API

### WebApp Component
- **Purpose:** Admin dashboard and web interface
- **Key Files:**
  - [src/pages/](WebApp/src/pages/) - Page components
  - [src/services/](WebApp/src/services/) - API integration
  - [src/context/](WebApp/src/context/) - Auth & state management
- **Port:** 5173 (dev)
- **Build:** Vite

### Similarity_python Service
- **Purpose:** NLP/ML processing for answer verification
- **Key Files:**
  - [app.py](Similarity_python/app.py) - Flask API
  - [local_nlp_checker.py](Similarity_python/local_nlp_checker.py) - spaCy NLP
  - [gemini_batch_checker.py](Similarity_python/gemini_batch_checker.py) - Gemini AI
- **Port:** 5000
- **Models:** spaCy en_core_web_lg






