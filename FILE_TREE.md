# 📁 Complete Project File Tree

```
D:\.SLIIT\RP 2\
│
├── 📄 README.md                                    # Main project documentation
├── 📄 SETUP_GUIDE.md                               # Step-by-step setup instructions
├── 📄 PROJECT_SUMMARY.md                           # Complete project summary
├── 📄 copilot-master.md                            # Original requirements
│
├── 📁 services/                                    # Backend microservices
│   └── 📁 ai-question-service/                     # Question generation service
│       │
│       ├── 📁 src/                                 # Source code
│       │   │
│       │   ├── 📁 config/                          # Configuration files
│       │   │   ├── 📄 database.js                  # PostgreSQL config
│       │   │   └── 📄 claude.js                    # Claude API config
│       │   │
│       │   ├── 📁 controllers/                     # Business logic
│       │   │   ├── 📄 questionsController.js       # Question generation logic
│       │   │   └── 📄 itemsController.js           # Item CRUD operations
│       │   │
│       │   ├── 📁 db/                              # Database layer
│       │   │   ├── 📄 index.js                     # Connection pool & query wrapper
│       │   │   ├── 📄 schema.sql                   # Database schema (items, item_questions)
│       │   │   └── 📄 setup.js                     # Database setup script
│       │   │
│       │   ├── 📁 routes/                          # API routes
│       │   │   ├── 📄 questions.js                 # POST /api/questions/generate
│       │   │   └── 📄 items.js                     # POST /api/items/create, GET /api/items/:id
│       │   │
│       │   ├── 📁 utils/                           # Utility functions
│       │   │   ├── 📄 claudeClient.js              # Claude Sonnet API wrapper
│       │   │   └── 📄 responseHandler.js           # Response formatting utilities
│       │   │
│       │   └── 📄 server.js                        # Express app entry point
│       │
│       ├── 📄 package.json                         # Node.js dependencies & scripts
│       ├── 📄 .env.example                         # Environment variables template
│       ├── 📄 .gitignore                           # Git ignore rules
│       └── 📄 README.md                            # Backend documentation
│
└── 📁 mobile/                                      # Mobile applications
    └── 📁 flutter_app/                             # Flutter mobile app
        │
        ├── 📁 lib/                                 # Dart source code
        │   │
        │   ├── 📁 models/                          # Data models
        │   │   ├── 📄 question.dart                # Question model (text, isSelected, answer)
        │   │   └── 📄 item.dart                    # Item model (id, category, description, etc.)
        │   │
        │   ├── 📁 services/                        # Service layer
        │   │   └── 📄 api_service.dart             # HTTP API client (all endpoints)
        │   │
        │   ├── 📁 screens/                         # UI screens
        │   │   ├── 📄 add_item_screen.dart         # Screen 1: Input category & description
        │   │   ├── 📄 select_questions_screen.dart # Screen 2: Select AI questions
        │   │   ├── 📄 answer_questions_screen.dart # Screen 3: Provide answers
        │   │   └── 📄 item_success_screen.dart     # Screen 4: Success confirmation
        │   │
        │   └── 📄 main.dart                        # App entry point & navigation
        │
        ├── 📄 pubspec.yaml                         # Flutter dependencies
        └── 📄 README.md                            # Mobile app documentation
```

---

## 📊 File Statistics

### Backend (ai-question-service)
```
Total Files: 15
├── Source Code: 11 (.js files)
├── Configuration: 2 (.env.example, .gitignore)
├── Database: 1 (.sql file)
└── Documentation: 1 (README.md)

Total Lines of Code: ~1,500
```

### Mobile (flutter_app)
```
Total Files: 10
├── Source Code: 9 (.dart files)
├── Configuration: 1 (pubspec.yaml)
└── Documentation: 1 (README.md)

Total Lines of Code: ~1,200
```

### Documentation
```
Total Files: 4
├── Main README: README.md (~3,000 words)
├── Setup Guide: SETUP_GUIDE.md (~4,000 words)
├── Project Summary: PROJECT_SUMMARY.md (~3,000 words)
└── Requirements: copilot-master.md (original spec)

Total Words: ~15,000
```

---

## 🎯 Key Files Explained

### Backend Essential Files

**`src/server.js`** - Express server entry point
- Configures Express app
- Sets up middleware (CORS, JSON parsing)
- Registers routes
- Starts HTTP server on port 3000

**`src/utils/claudeClient.js`** - AI integration
- Connects to Claude Sonnet API
- Generates 8-10 verification questions
- Handles AI API errors

**`src/controllers/itemsController.js`** - Core business logic
- Creates items with transactions
- Stores questions and answers
- Retrieves items by ID

**`src/db/schema.sql`** - Database structure
```sql
items           # Stores found items
item_questions  # Stores Q&A pairs
```

### Mobile Essential Files

**`lib/main.dart`** - App entry point
- Initializes Flutter app
- Sets up Material theme
- Defines navigation

**`lib/screens/add_item_screen.dart`** - First screen
- Input form for item details
- Calls AI question generation
- Validates input

**`lib/screens/select_questions_screen.dart`** - Second screen
- Displays AI-generated questions
- Checkbox selection
- Validates at least 1 selected

**`lib/screens/answer_questions_screen.dart`** - Third screen
- Answer form for selected questions
- Validates all answers filled
- Saves to backend

**`lib/screens/item_success_screen.dart`** - Fourth screen
- Success confirmation
- Displays item ID
- Shows item details

**`lib/services/api_service.dart`** - API client
- HTTP communication with backend
- Error handling
- JSON parsing

---

## 🔧 Configuration Files

### Backend Configuration

**`.env.example`** - Environment template
```env
PORT=3000
DB_HOST=localhost
DB_NAME=lost_found_db
DB_USER=postgres
DB_PASSWORD=your_password
CLAUDE_API_KEY=your_key
```

**`package.json`** - NPM configuration
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "pg": "^8.11.3",
    "@anthropic-ai/sdk": "^0.9.1",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1"
  }
}
```

### Mobile Configuration

**`pubspec.yaml`** - Flutter dependencies
```yaml
dependencies:
  flutter: sdk
  http: ^1.1.0
  provider: ^6.1.1
  cupertino_icons: ^1.0.6
```

---

## 📡 API Endpoints Map

```
Backend Server (http://localhost:3000)
│
├── GET  /                          # Welcome message & endpoint list
├── GET  /health                    # Health check
│
├── POST /api/questions/generate    # Generate AI questions
│   Request:  { category, description }
│   Response: { success, data: { questions: [] } }
│
├── POST /api/items/create          # Create item with Q&A
│   Request:  { category, description, founderId, questions: [] }
│   Response: { success, data: { item: {...} } }
│
├── GET  /api/items/:itemId         # Get item by ID
│   Response: { success, data: { item: {...} } }
│
└── GET  /api/items                 # Get all items
    Response: { success, data: { items: [], count: n } }
```

---

## 🗄️ Database Schema

```sql
Database: lost_found_db
│
├── Table: items
│   ├── id (SERIAL PRIMARY KEY)
│   ├── category (VARCHAR)
│   ├── description (TEXT)
│   ├── founder_id (VARCHAR)
│   ├── created_at (TIMESTAMP)
│   └── updated_at (TIMESTAMP)
│
└── Table: item_questions
    ├── id (SERIAL PRIMARY KEY)
    ├── item_id (INTEGER, FK → items.id)
    ├── question (TEXT)
    ├── founder_answer (TEXT)
    └── created_at (TIMESTAMP)
```

---

## 🎨 Mobile App Screen Flow

```
┌─────────────────────────────────────┐
│      add_item_screen.dart           │
│  - Input founder ID                 │
│  - Select category (dropdown)       │
│  - Enter description (textarea)     │
│  - Click "Generate Questions"       │
└─────────────┬───────────────────────┘
              │
              ↓ API: POST /api/questions/generate
              ↓
┌─────────────────────────────────────┐
│   select_questions_screen.dart      │
│  - Display 8-10 AI questions        │
│  - Checkbox selection               │
│  - Show selected count              │
│  - Click "Continue to Answer"       │
└─────────────┬───────────────────────┘
              │
              ↓ Navigate with selected questions
              ↓
┌─────────────────────────────────────┐
│   answer_questions_screen.dart      │
│  - Show selected questions          │
│  - Text input for each answer       │
│  - Validate all filled              │
│  - Click "Save Item"                │
└─────────────┬───────────────────────┘
              │
              ↓ API: POST /api/items/create
              ↓
┌─────────────────────────────────────┐
│   item_success_screen.dart          │
│  - Display item ID                  │
│  - Show item details                │
│  - Copy ID button                   │
│  - "Report Another" / "Home"        │
└─────────────────────────────────────┘
```

---

## 📦 Dependencies Overview

### Backend Dependencies
```
Production:
├── express         (Web framework)
├── cors            (Cross-origin requests)
├── dotenv          (Environment variables)
├── pg              (PostgreSQL client)
├── @anthropic-ai/sdk (Claude AI)
└── express-validator (Input validation)

Development:
└── nodemon         (Auto-restart)
```

### Mobile Dependencies
```
Production:
├── flutter         (UI framework)
├── http            (HTTP client)
├── provider        (State management)
└── cupertino_icons (iOS icons)

Development:
└── flutter_lints   (Code linting)
```

---

## 🚀 Startup Commands

### Backend
```bash
# Development mode (auto-reload)
npm run dev

# Production mode
npm start

# Setup database
npm run db:setup
```

### Mobile
```bash
# Run on connected device
flutter run

# Run on specific device
flutter run -d <device-id>

# Build release APK
flutter build apk --release
```

---

## 📈 Project Growth Potential

### Current (Phase 1)
- ✅ 29 files
- ✅ ~2,700 lines of code
- ✅ 5 API endpoints
- ✅ 4 mobile screens
- ✅ 2 database tables

### Future (Phase 2-3)
- 🔮 50+ files
- 🔮 ~8,000 lines of code
- 🔮 15+ API endpoints
- 🔮 10+ mobile screens
- 🔮 6+ database tables

---

**Complete file structure delivered! ✅**
