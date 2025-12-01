# FindAssure - Lost & Found System

## 🎯 Project Overview

FindAssure is a comprehensive Lost & Found mobile application built with React Native and Expo for a final year research project. The app helps reunite people with their lost belongings through a smart verification system.

## 👥 User Roles

1. **Item Owner** - People who lost items
2. **Item Founder** - People who found items
3. **Admin** - System administrators

## 🏗️ Project Structure

```
FindAssure/
├── app/                          # Expo Router app directory
│   └── _layout.tsx              # Main app entry point
├── src/
│   ├── api/                     # API integration
│   │   ├── axiosClient.ts       # Axios configuration with interceptors
│   │   ├── authApi.ts           # Authentication endpoints
│   │   └── itemsApi.ts          # Items & verification endpoints
│   ├── components/              # Reusable components
│   │   ├── ItemCard.tsx         # Found item card display
│   │   ├── PrimaryButton.tsx    # Primary action button
│   │   └── QuestionChip.tsx     # Question selection chip
│   ├── context/                 # React Context providers
│   │   └── AuthContext.tsx      # Authentication state management
│   ├── navigation/              # Navigation configuration
│   │   └── RootNavigator.tsx    # Main navigation setup
│   ├── screens/
│   │   ├── HomeScreen.tsx       # Main landing screen
│   │   ├── auth/                # Authentication screens
│   │   │   ├── LoginScreen.tsx
│   │   │   ├── RegisterScreen.tsx
│   │   │   └── ProfileScreen.tsx
│   │   ├── founder/             # Founder flow (6 screens)
│   │   │   ├── ReportFoundStartScreen.tsx
│   │   │   ├── ReportFoundDetailsScreen.tsx
│   │   │   ├── ReportFoundQuestionsScreen.tsx
│   │   │   ├── ReportFoundAnswersScreen.tsx
│   │   │   ├── ReportFoundLocationScreen.tsx
│   │   │   └── ReportFoundSuccessScreen.tsx
│   │   ├── owner/               # Owner flow (5 screens)
│   │   │   ├── FindLostStartScreen.tsx
│   │   │   ├── FindLostResultsScreen.tsx
│   │   │   ├── ItemDetailScreen.tsx
│   │   │   ├── AnswerQuestionsVideoScreen.tsx
│   │   │   └── VerificationPendingScreen.tsx
│   │   └── admin/               # Admin flow (3 screens)
│   │       ├── AdminLoginScreen.tsx
│   │       ├── AdminDashboardScreen.tsx
│   │       └── AdminItemDetailScreen.tsx
│   └── types/
│       └── models.ts            # TypeScript type definitions
└── package.json
```

## 🚀 Tech Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Navigation**: React Navigation (Stack Navigator)
- **State Management**: React Context API
- **Authentication**: Firebase Authentication
- **HTTP Client**: Axios
- **Media**: Expo Image Picker, Expo Camera, Expo AV
- **Storage**: AsyncStorage

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd FindAssure
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Firebase**
   - Update `src/context/AuthContext.tsx` with your Firebase config:
   ```typescript
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_AUTH_DOMAIN",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_STORAGE_BUCKET",
     messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
     appId: "YOUR_APP_ID"
   };
   ```

4. **Configure Backend URL**
   - Update `src/api/axiosClient.ts`:
   ```typescript
   const BASE_URL = 'YOUR_BACKEND_URL';
   ```

5. **Start the development server**
   ```bash
   npm start
   ```

## 📱 App Flows

### 🔍 Founder Flow - Report Found Item
1. **Start**: Select/capture item image
2. **Details**: Enter category and description
3. **Questions**: Select exactly 5 verification questions
4. **Answers**: Provide text answers to selected questions
5. **Location**: Enter found location and contact info
6. **Success**: Confirmation screen

### 🔎 Owner Flow - Find Lost Item
1. **Start**: Enter category and description (login required)
2. **Results**: Browse matching found items
3. **Detail**: View item details and questions (NO founder answers shown)
4. **Video Answers**: Record video answers to questions
5. **Pending**: Verification in progress

### 🔐 Admin Flow
1. **Login**: Admin authentication
2. **Dashboard**: View system statistics and all items
3. **Item Detail**: View full item info (including founder answers) and change status

## 🔑 Key Features

### Security & Privacy
- ✅ Owner must login to search for lost items
- ✅ Founder answers are NEVER shown to owners in UI
- ✅ Admin can see everything for moderation
- ✅ Video verification for ownership proof
- ✅ Firebase authentication with JWT tokens

### Business Rules
- ✅ Founders must select EXACTLY 5 questions
- ✅ Location where item was found is stored and displayed
- ✅ Owner must answer all questions via video
- ✅ Verification required before showing founder contact info

## 🎨 UI/UX Guidelines

- Clean, modern interface with consistent styling
- Color scheme: Primary blue (#4A90E2), success green, warning orange
- Card-based layout for items
- Clear status badges (available, pending_verification, claimed)
- Responsive design for various screen sizes

## 🔧 Development Notes

### Current Implementation Status
- ✅ Full navigation structure
- ✅ All 17 screens implemented
- ✅ Authentication context and Firebase integration
- ✅ API client with interceptors
- ✅ Type-safe TypeScript definitions
- 🟡 Video recording (stubbed - ready for Expo Camera integration)
- 🟡 Backend API (endpoints defined, needs backend implementation)
- 🟡 Image upload to cloud storage (currently using local URIs)

### TODO for Production
1. Implement actual video recording with Expo Camera/AV
2. Set up cloud storage (Firebase Storage or AWS S3) for images/videos
3. Connect to real backend API
4. Implement AI-based similarity matching for lost/found items
5. Add push notifications for matches and verifications
6. Implement real-time updates
7. Add map integration for location selection
8. Set up analytics and error tracking

## 🧪 Testing

```bash
# Run linter
npm run lint

# Start on specific platform
npm run android
npm run ios
npm run web
```

## 📄 API Endpoints (Backend Requirements)

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/users/me` - Get current user profile
- `PATCH /api/users/me` - Update user profile

### Items
- `POST /api/items/found` - Report found item
- `GET /api/items/found` - Get all found items
- `GET /api/items/found/:id` - Get specific found item
- `POST /api/items/lost` - Report lost item
- `POST /api/items/verification` - Submit verification request

### Admin
- `GET /api/admin/overview` - Get system statistics
- `PATCH /api/admin/items/found/:id` - Update item status

## 👨‍💻 Developer

Built by LSYDananjaya for SLIIT Final Year Research Project

## 📝 License

This project is for academic purposes.
