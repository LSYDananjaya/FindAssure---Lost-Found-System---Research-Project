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



