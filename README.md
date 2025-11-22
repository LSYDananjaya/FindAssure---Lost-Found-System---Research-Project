# AI-Driven Lost & Found Verification System

Full-stack implementation of an AI-powered Lost & Found verification system with microservice architecture.

## 🎯 Project Overview

This system helps reunite lost items with their owners through AI-generated verification questions. The Phase 1 implementation focuses on the **Founder Flow** - allowing people who find items to register them with AI-powered verification questions.

## 🏗️ Architecture

```
lost-and-found-system/
├── services/
│   └── ai-question-service/          # Node.js + Express microservice
│       ├── src/
│       │   ├── config/               # Configuration files
│       │   ├── controllers/          # Business logic
│       │   ├── db/                   # Database layer
│       │   ├── routes/               # API routes
│       │   ├── utils/                # Utilities (Claude client)
│       │   └── server.js             # Express server
│       ├── package.json
│       └── README.md
│
├── mobile/
│   └── flutter_app/                  # Flutter mobile application
│       ├── lib/
│       │   ├── models/               # Data models
│       │   ├── services/             # API service layer
│       │   ├── screens/              # UI screens (4 screens)
│       │   └── main.dart             # App entry point
│       ├── pubspec.yaml
│       └── README.md
│
└── README.md                         # This file
```

## ✨ Features

### Backend (ai-question-service)
- 🤖 AI-powered question generation using Claude Sonnet API
- 🗄️ PostgreSQL database for persistent storage
- 🔒 Transaction-safe data operations
- ✅ Input validation and error handling
- 📝 RESTful API design
- 🚀 Microservice-ready architecture

### Mobile App (Flutter)
- 📱 Clean, Material Design 3 UI
- 🔄 4-screen guided workflow
- ✅ Interactive question selection
- 📝 Form validation
- 🔗 Real-time API integration
- ✨ Success confirmation with item tracking

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- PostgreSQL 13+
- Flutter SDK 3.0+
- Claude API key from Anthropic

### 1. Setup Backend

```bash
# Navigate to service
cd services/ai-question-service

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Setup database
npm run db:setup

# Start server
npm run dev
```

Backend will run on `http://localhost:3000`

### 2. Setup Mobile App

```bash
# Navigate to app
cd mobile/flutter_app

# Install dependencies
flutter pub get

# Update API endpoint in lib/services/api_service.dart
# Change baseUrl to your backend URL

# Run app
flutter run
```

## 📱 User Flow

### Phase 1: Founder Flow

1. **Add Item Screen**
   - Founder enters their ID
   - Selects item category
   - Provides detailed description
   - Clicks "Generate Questions"

2. **Select Questions Screen**
   - AI generates 8-10 verification questions
   - Founder selects questions they can answer
   - Shows selected count
   - Validates selection

3. **Answer Questions Screen**
   - Founder provides answers to selected questions
   - Each answer is validated
   - Saves to database

4. **Success Screen**
   - Shows generated Item ID
   - Displays item summary
   - Provides next steps information
   - Option to report another item

## 🔌 API Endpoints

### Health Check
```http
GET /health
```

### Generate Questions
```http
POST /api/questions/generate
Content-Type: application/json

{
  "category": "Electronics",
  "description": "Black iPhone 13 Pro with blue case"
}
```

### Create Item
```http
POST /api/items/create
Content-Type: application/json

{
  "category": "Electronics",
  "description": "Black iPhone 13 Pro",
  "founderId": "founder_123",
  "questions": [
    {
      "question": "What model is the iPhone?",
      "founderAnswer": "iPhone 13 Pro"
    }
  ]
}
```

### Get Item
```http
GET /api/items/:itemId
```

### Get All Items
```http
GET /api/items
```

## 🗄️ Database Schema

### Items Table
```sql
CREATE TABLE items (
    id SERIAL PRIMARY KEY,
    category VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    founder_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Item Questions Table
```sql
CREATE TABLE item_questions (
    id SERIAL PRIMARY KEY,
    item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    founder_answer TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🧪 Testing

### Test Backend API
```bash
# Generate questions
curl -X POST http://localhost:3000/api/questions/generate \
  -H "Content-Type: application/json" \
  -d '{"category":"Electronics","description":"Black iPhone with case"}'

# Create item
curl -X POST http://localhost:3000/api/items/create \
  -H "Content-Type: application/json" \
  -d '{
    "category":"Electronics",
    "description":"Black iPhone",
    "founderId":"founder_123",
    "questions":[{"question":"What model?","founderAnswer":"iPhone 13"}]
  }'

# Get item
curl http://localhost:3000/api/items/1
```

### Test Mobile App
1. Launch app in emulator/device
2. Follow the 4-screen flow
3. Verify item creation in backend
4. Check database for stored data

## 📋 Complete Setup Example

```bash
# 1. Backend Setup
cd services/ai-question-service
npm install
cp .env.example .env
# Edit .env:
# - Add your Claude API key
# - Configure PostgreSQL credentials
npm run db:setup
npm run dev

# 2. In a new terminal - Mobile Setup
cd mobile/flutter_app
flutter pub get
# Edit lib/services/api_service.dart
# - Update baseUrl to http://10.0.2.2:3000 (for Android emulator)
flutter run

# 3. Test the flow
# - Open app
# - Enter founder ID: "test_founder_001"
# - Select category: "Electronics"
# - Enter description: "Black iPhone 13 Pro with blue case, minor scratches"
# - Generate questions
# - Select 3-4 questions
# - Answer all questions
# - Save and view success screen
```

## 🔮 Future Phases

### Phase 2: Claim Verification
- Claimant flow to search and claim items
- Answer verification against founder's answers
- Similarity scoring using AI
- Match notifications

### Phase 3: Advanced Features
- Image upload and analysis
- Vision-based category detection
- Item similarity matching
- Real-time notifications
- User authentication
- Dashboard and analytics

### Planned Microservices
- `vision-category-service` - AI image categorization
- `similarity-service` - Item matching algorithm
- `claim-service` - Claimant verification flow
- `notification-service` - Push notifications
- `auth-service` - User authentication

## 📂 Project Structure Details

### Backend Structure
```
ai-question-service/
├── src/
│   ├── config/
│   │   ├── database.js       # DB connection config
│   │   └── claude.js         # Claude API config
│   ├── controllers/
│   │   ├── questionsController.js
│   │   └── itemsController.js
│   ├── db/
│   │   ├── index.js          # Connection pool
│   │   ├── schema.sql        # Database schema
│   │   └── setup.js          # Setup script
│   ├── routes/
│   │   ├── questions.js      # Question routes
│   │   └── items.js          # Item routes
│   ├── utils/
│   │   ├── claudeClient.js   # Claude API wrapper
│   │   └── responseHandler.js
│   └── server.js             # Express app
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

### Mobile Structure
```
flutter_app/
├── lib/
│   ├── models/
│   │   ├── question.dart     # Question model
│   │   └── item.dart         # Item model
│   ├── services/
│   │   └── api_service.dart  # HTTP client
│   ├── screens/
│   │   ├── add_item_screen.dart
│   │   ├── select_questions_screen.dart
│   │   ├── answer_questions_screen.dart
│   │   └── item_success_screen.dart
│   └── main.dart
├── pubspec.yaml
└── README.md
```

## 🛠️ Technology Stack

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** PostgreSQL
- **AI:** Claude Sonnet API (Anthropic)
- **Validation:** express-validator
- **CORS:** cors middleware

### Mobile
- **Framework:** Flutter
- **Language:** Dart
- **HTTP Client:** http package
- **UI:** Material Design 3
- **State Management:** Built-in setState

## 🔧 Configuration

### Backend Environment Variables
```env
PORT=3000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=lost_found_db
DB_USER=postgres
DB_PASSWORD=your_password
CLAUDE_API_KEY=your_claude_key
CLAUDE_MODEL=claude-sonnet-4-20250514
CORS_ORIGIN=http://localhost:8080
```

### Mobile API Configuration
```dart
// lib/services/api_service.dart
static const String baseUrl = 'http://localhost:3000';

// For Android Emulator: http://10.0.2.2:3000
// For iOS Simulator: http://localhost:3000
// For Physical Device: http://YOUR_IP:3000
```

## 📊 Data Flow

```
Mobile App
    ↓
[1] POST /api/questions/generate
    → Claude Sonnet API
    → Returns 8-10 questions
    ↓
[2] User selects questions
    ↓
[3] User provides answers
    ↓
[4] POST /api/items/create
    → PostgreSQL Database
    → Stores item + questions + answers
    ↓
[5] Returns item ID
    ↓
Success Screen
```

## 🐛 Troubleshooting

### Backend Issues

**Database connection failed:**
```bash
# Check PostgreSQL is running
psql -U postgres

# Verify database exists
\l

# Recreate database
DROP DATABASE IF EXISTS lost_found_db;
CREATE DATABASE lost_found_db;

# Re-run schema
npm run db:setup
```

**Claude API errors:**
- Verify API key in .env
- Check account credits
- Ensure model name is correct

### Mobile Issues

**Cannot connect to backend:**
- Use correct IP for emulator/device
- Check backend is running
- Verify firewall settings
- Test backend health: `curl http://localhost:3000/health`

**Build errors:**
```bash
flutter clean
flutter pub get
flutter run
```

## 📝 Development Notes

### Adding New Features

**Backend:**
1. Add route in `src/routes/`
2. Create controller in `src/controllers/`
3. Update database schema if needed
4. Document in README

**Mobile:**
1. Create new screen in `lib/screens/`
2. Update navigation in relevant screens
3. Add API method in `api_service.dart`
4. Update models if needed

### Best Practices

- ✅ Always validate input on both client and server
- ✅ Use transactions for multi-table operations
- ✅ Handle errors gracefully with user-friendly messages
- ✅ Log important operations for debugging
- ✅ Keep API responses consistent
- ✅ Use environment variables for configuration
- ✅ Write clear comments and documentation

## 📄 License

MIT License - Free to use and modify

## 🤝 Contributing

This is a university research project (Phase 1 implementation). Future phases will expand functionality for production use.

## 📞 Support

- Backend Documentation: `services/ai-question-service/README.md`
- Mobile Documentation: `mobile/flutter_app/README.md`
- API Reference: Visit `http://localhost:3000` when running

---

**Built for SLIIT Research Project - AI-Driven Lost & Found Verification System**

Phase 1 Complete ✅
- ✅ Backend microservice with AI integration
- ✅ PostgreSQL database setup
- ✅ Flutter mobile app with 4-screen flow
- ✅ Complete API integration
- ✅ Documentation and setup guides
