# FindAssure System Integration Guide

## System Architecture Overview

The FindAssure Lost & Found System consists of three main components:

```
┌─────────────────────────────────────────────────────────────┐
│                    FindAssure System                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   Web App    │    │  Mobile App  │    │   Backend    │  │
│  │   (React)    │    │ (React Native│    │  (Node.js)   │  │
│  │              │────│              │────│              │  │
│  │  Port: 3000  │    │  Expo/Metro  │    │  Port: 5000  │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│         │                    │                    │          │
│         │                    │                    │          │
│         └────────────────────┴────────────────────┘          │
│                              │                               │
│                              ▼                               │
│                    ┌──────────────────┐                     │
│                    │    MongoDB       │                     │
│                    │   Database       │                     │
│                    └──────────────────┘                     │
│                              │                               │
│                              ▼                               │
│                    ┌──────────────────┐                     │
│                    │   Gemini AI API  │                     │
│                    │  (Google Cloud)  │                     │
│                    └──────────────────┘                     │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

### 1. Backend (`/Backend`)
**Technology**: Node.js + Express + TypeScript + MongoDB + Gemini AI

**Responsibilities**:
- RESTful API endpoints
- Database operations (CRUD)
- AI question generation (Gemini)
- Business logic and validation
- Authentication/Authorization
- CORS handling

**Key Files**:
- `src/controllers/itemController.ts` - API endpoints
- `src/services/geminiService.ts` - AI integration
- `src/models/FoundItem.ts` - Data models
- `src/routes/itemRoutes.ts` - API routes

### 2. Mobile App (`/FindAssure`)
**Technology**: React Native + Expo + TypeScript

**Responsibilities**:
- Mobile user interface
- Native device features (camera, GPS)
- Offline support
- Push notifications
- Same API as web app

**Key Features**:
- Add found items with photos
- Answer verification questions
- Browse found items
- Video recording for answers

### 3. Web App (`/WebApp`) ✨ NEW
**Technology**: React + Vite + TypeScript

**Responsibilities**:
- Web-based user interface
- Desktop/laptop experience
- Same functionality as mobile app
- Better for extended form filling
- Larger screen real estate

**Key Features**:
- Add found items (3-step wizard)
- Dashboard with filters
- Item details and verification
- Contact information display

## Data Flow

### Adding a Found Item

```
┌─────────┐       ┌─────────┐       ┌──────────┐       ┌─────────┐
│ Web App │──1──▶ │ Backend │──2──▶ │ Gemini   │       │ MongoDB │
│         │       │         │       │ AI API   │       │         │
│         │◀──3── │         │◀──────│          │       │         │
│         │       │         │                   │       │         │
│         │──4──▶ │         │──────────────5──▶│       │         │
│         │◀──6── │         │◀─────────────────│       │         │
└─────────┘       └─────────┘                   └──────────────────┘

1. User enters category & description
2. Backend requests questions from Gemini AI
3. AI returns 10 questions
4. User answers questions + adds contact info
5. Backend saves to MongoDB
6. Success response to web app
```

### Claiming an Item (Verification)

```
┌─────────┐       ┌─────────┐       ┌─────────┐
│ Web App │──1──▶ │ Backend │──2──▶ │ MongoDB │
│         │◀──3── │         │◀──────│         │
│         │       │         │       │         │
│         │──4──▶ │         │──5──▶ │         │
│         │◀──6── │         │◀──────│         │
└─────────┘       └─────────┘       └─────────┘

1. User views found item
2. Backend retrieves item from DB
3. Item details (without founder answers) returned
4. User submits verification answers
5. Backend saves verification to DB
6. Verification created confirmation
```

## Shared Data Models

All three components use the same data structures:

### FoundItem
```typescript
{
  _id: string;
  imageUrl: string;
  category: string;
  description: string;
  questions: string[];        // 10 AI-generated questions
  founderAnswers: string[];   // Hidden from owners
  location: string;
  status: 'available' | 'pending_verification' | 'claimed';
  founderContact: {
    name: string;
    email: string;
    phone: string;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

### Verification
```typescript
{
  _id: string;
  foundItemId: string;
  ownerId: string;
  answers: Array<{
    questionId: number;
    question: string;
    founderAnswer: string;    // For admin view only
    ownerAnswer: string;
    videoKey: string;
  }>;
  status: 'pending' | 'passed' | 'failed';
  similarityScore: number | null;
  createdAt: Date;
  updatedAt: Date;
}
```

## API Endpoints (Shared)

Both web and mobile apps use these endpoints:

```
POST   /api/items/generate-questions    Generate AI questions
POST   /api/items/found                 Create found item
GET    /api/items/found                 List all found items
GET    /api/items/found/:id             Get single item
POST   /api/items/verification          Create verification
GET    /api/items/verification/:id      Get verification
GET    /api/items/verification/me       Get my verifications
POST   /api/items/lost                  Create lost request
GET    /api/items/lost/me               Get my lost requests
```

## Running the Complete System

### Step 1: Start MongoDB
```bash
# Using Docker
docker run -d -p 27017:27017 --name mongodb mongo

# Or use MongoDB Atlas (cloud)
```

### Step 2: Start Backend
```bash
cd Backend
npm install
npm run dev
# Runs on http://localhost:5000
```

### Step 3: Start Web App
```bash
cd WebApp
npm install
npm run dev
# Runs on http://localhost:3000
```

### Step 4: Start Mobile App (Optional)
```bash
cd FindAssure
npm install
npm start
# Opens Expo Dev Tools
```

## Environment Configuration

### Backend `.env`
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/findassure
GEMINI_API_KEY=your_gemini_api_key_here
FIREBASE_ADMIN_SDK_PATH=./serviceAccountKey.json
```

### Web App `.env`
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

### Mobile App `.env`
```env
API_BASE_URL=http://localhost:5000/api
```

## Feature Comparison

| Feature | Web App | Mobile App | Backend |
|---------|---------|------------|---------|
| Add Found Item | ✅ | ✅ | ✅ API |
| AI Question Generation | ✅ | ✅ | ✅ Logic |
| Browse Items | ✅ | ✅ | ✅ API |
| Claim Item (Verify) | ✅ | ✅ | ✅ API |
| Filter by Category | ✅ | ✅ | ✅ API |
| Filter by Status | ✅ | ✅ | ✅ API |
| Image Upload | ❌* | ✅ | ✅ API |
| Video Answers | ❌* | ✅ | ✅ Storage |
| Push Notifications | ❌ | ✅ | ✅ Logic |
| Offline Mode | ❌ | ✅ | N/A |
| Authentication | ⚠️** | ✅ | ✅ API |
| GPS Location | ❌ | ✅ | N/A |

*Can be added in future
**Currently uses public API endpoints

## Development Workflow

### Adding a New Feature

1. **Update Backend** (`/Backend`)
   - Add new endpoint in controllers
   - Update models if needed
   - Add route
   - Test with Postman

2. **Update Web App** (`/WebApp`)
   - Add API function in `services/api.ts`
   - Create/update components
   - Add styling
   - Test in browser

3. **Update Mobile App** (`/FindAssure`)
   - Add API function in `src/api/`
   - Create/update screens
   - Add styling
   - Test on device/emulator

### Testing Integration

```bash
# Terminal 1: Backend
cd Backend && npm run dev

# Terminal 2: Web App
cd WebApp && npm run dev

# Terminal 3: Mobile App
cd FindAssure && npm start
```

## Deployment Options

### Backend
- **Cloud**: AWS EC2, Google Cloud Run, Heroku
- **Database**: MongoDB Atlas (cloud)
- **AI**: Google Cloud (Gemini API)

### Web App
- **Static Hosting**: Vercel, Netlify, AWS S3 + CloudFront
- **Container**: Docker + AWS ECS

### Mobile App
- **iOS**: App Store (via Expo/EAS)
- **Android**: Google Play Store (via Expo/EAS)

## Security Considerations

### Current Implementation
- Public API endpoints (no auth required for basic features)
- CORS enabled for web access
- Input validation on backend
- Environment variables for secrets

### Recommended Enhancements
- [ ] JWT authentication
- [ ] Role-based access control (RBAC)
- [ ] Rate limiting
- [ ] API key authentication
- [ ] HTTPS enforcement
- [ ] Input sanitization
- [ ] SQL injection prevention

## Monitoring & Debugging

### Backend Logs
```bash
cd Backend
npm run dev
# Watch console for API requests
```

### Web App Debugging
- Chrome DevTools (F12)
- Network tab for API calls
- Console for errors
- React DevTools extension

### Mobile App Debugging
- Expo DevTools
- React Native Debugger
- Console logs in terminal

## Common Integration Issues

### CORS Errors
**Symptom**: Web app can't connect to backend
**Solution**: Update CORS config in `Backend/src/app.ts`
```typescript
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:19006']
}));
```

### Port Conflicts
**Symptom**: "Address already in use"
**Solution**: Change ports in configs
- Backend: `PORT` in `.env`
- Web: `server.port` in `vite.config.ts`

### MongoDB Connection
**Symptom**: "MongoServerError: connect ECONNREFUSED"
**Solution**: 
- Ensure MongoDB is running
- Check `MONGODB_URI` in backend `.env`
- Try MongoDB Atlas instead of local

### API Base URL
**Symptom**: 404 errors from web/mobile app
**Solution**: Verify API URL in `.env` files matches backend

## Documentation Files

- `Backend/README.md` - Backend setup and API docs
- `Backend/API_DOCUMENTATION.md` - Detailed API reference
- `WebApp/WEB_README.md` - Web app setup guide
- `WebApp/QUICK_START.md` - Quick reference for web app
- `FindAssure/README.md` - Mobile app documentation

## Support & Resources

- **Backend Issues**: Check `Backend/README.md`
- **Web Issues**: Check `WebApp/WEB_README.md`
- **API Reference**: Check `Backend/API_DOCUMENTATION.md`
- **Quick Start**: Check `WebApp/QUICK_START.md`

---

**Last Updated**: December 2025
**Project**: SLIIT Research - FindAssure Lost & Found System
