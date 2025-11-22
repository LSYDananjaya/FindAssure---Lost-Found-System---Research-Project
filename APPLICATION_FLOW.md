# Application Flow Diagram

## User Journey - Found Item Reporting

```
┌─────────────────────────────────────────────────────────────────┐
│                    START: Add Item Screen                        │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  📝 Form Input:                                           │  │
│  │  • Founder ID (text input)                               │  │
│  │  • Category (dropdown)                                    │  │
│  │  • Description (textarea)                                 │  │
│  │                                                           │  │
│  │  [Generate Verification Questions] Button                │  │
│  └──────────────────────────────────────────────────────────┘  │
│                             │                                    │
│                             ▼                                    │
│                    📡 API Call to Backend                        │
│                    POST /api/questions/generate                  │
│                             │                                    │
└─────────────────────────────┼────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                Select Questions Screen                           │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  📋 AI-Generated Questions (List):                       │  │
│  │                                                           │  │
│  │  □ Question 1                                            │  │
│  │  ☑ Question 2   ← User selects                          │  │
│  │  ☑ Question 3   ← User selects                          │  │
│  │  □ Question 4                                            │  │
│  │  ☑ Question 5   ← User selects                          │  │
│  │                                                           │  │
│  │  Selected: 3 questions                                    │  │
│  │                                                           │  │
│  │  [Continue to Answer] Button                             │  │
│  └──────────────────────────────────────────────────────────┘  │
│                             │                                    │
└─────────────────────────────┼────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 Answer Questions Screen                          │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  ✏️ Answer Form:                                          │  │
│  │                                                           │  │
│  │  ❶ Question 2 text here?                                │  │
│  │  └─ [Answer textarea] ____________________________       │  │
│  │                                                           │  │
│  │  ❷ Question 3 text here?                                │  │
│  │  └─ [Answer textarea] ____________________________       │  │
│  │                                                           │  │
│  │  ❸ Question 5 text here?                                │  │
│  │  └─ [Answer textarea] ____________________________       │  │
│  │                                                           │  │
│  │  [Save Item] Button                                      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                             │                                    │
│                             ▼                                    │
│                    📡 API Call to Backend                        │
│                    POST /api/items/create                        │
│                             │                                    │
│                             ▼                                    │
│                    💾 Saved to Database                          │
│                             │                                    │
└─────────────────────────────┼────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Success Screen                               │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  ✅ Item Saved Successfully!                              │  │
│  │                                                           │  │
│  │  Item Details:                                            │  │
│  │  • Item ID: #12345                                        │  │
│  │  • Category: Electronics                                  │  │
│  │  • Description: Found black smartphone...                │  │
│  │  • Founder ID: FOUNDER001                                │  │
│  │  • Questions: 3 verification questions                   │  │
│  │  • Registered: 2025-11-19 10:30 AM                       │  │
│  │                                                           │  │
│  │  ℹ️ What's next?                                          │  │
│  │  The owner can now verify their identity by answering    │  │
│  │  your questions.                                          │  │
│  │                                                           │  │
│  │  [Report Another Item] Button                            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                             │                                    │
└─────────────────────────────┼────────────────────────────────────┘
                              │
                              ▼ (loops back to start)
                      Add Item Screen
```

## Technical Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         BROWSER                                  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐   │
│  │              React Web Application                      │   │
│  │              (http://localhost:5173)                    │   │
│  │                                                         │   │
│  │  Components:                                            │   │
│  │  • AddItemScreen.jsx                                   │   │
│  │  • SelectQuestionsScreen.jsx                           │   │
│  │  • AnswerQuestionsScreen.jsx                           │   │
│  │  • SuccessScreen.jsx                                   │   │
│  │                                                         │   │
│  │  Router: React Router v6                               │   │
│  │  State: React useState hooks                           │   │
│  │  Styling: Custom CSS                                    │   │
│  └────────────────────────────────────────────────────────┘   │
│                             │                                   │
│                             │ HTTP Requests (Axios)             │
│                             ▼                                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND SERVER                                │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐   │
│  │         Node.js + Express API Server                    │   │
│  │         (http://localhost:3000)                         │   │
│  │                                                         │   │
│  │  Routes:                                                │   │
│  │  • POST /api/questions/generate                        │   │
│  │  • POST /api/items/create                              │   │
│  │  • GET  /api/items/:id                                 │   │
│  │  • GET  /health                                         │   │
│  │                                                         │   │
│  │  Services:                                              │   │
│  │  • Claude AI API (Question Generation)                 │   │
│  │  • PostgreSQL Database (Storage)                       │   │
│  └────────────────────────────────────────────────────────┘   │
│                             │                                   │
│                             ▼                                   │
│  ┌────────────────────────────────────────────────────────┐   │
│  │              PostgreSQL Database                        │   │
│  │                                                         │   │
│  │  Tables:                                                │   │
│  │  • items (id, category, description, founder_id)       │   │
│  │  • questions (id, item_id, text, answer)               │   │
│  └────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

```
User Input → React State → API Service → Backend Controller
                                              ↓
                                         Validate
                                              ↓
                                         Claude AI
                                              ↓
                                         Database
                                              ↓
                                         Response
                                              ↓
Backend → API Service → React State → UI Update
```

## File Structure Visual

```
web/
│
├── public/                       (Static assets)
│
├── src/
│   ├── screens/                 (React Components)
│   │   ├── AddItemScreen.jsx    ──┐
│   │   ├── SelectQuestionsScreen.jsx ─┤
│   │   ├── AnswerQuestionsScreen.jsx ─┤─► All use apiService
│   │   └── SuccessScreen.jsx    ──┘
│   │
│   ├── services/
│   │   └── apiService.js        ──► Axios HTTP client
│   │
│   ├── styles/                  (CSS files)
│   │   ├── App.css
│   │   ├── AddItemScreen.css
│   │   ├── SelectQuestionsScreen.css
│   │   ├── AnswerQuestionsScreen.css
│   │   └── SuccessScreen.css
│   │
│   ├── App.jsx                  ──► Router setup
│   └── main.jsx                 ──► Entry point
│
├── index.html                    ──► HTML template
├── vite.config.js               ──► Build config
└── package.json                 ──► Dependencies
```

## Component Communication

```
App.jsx (Router)
    │
    ├── Route: "/"
    │   └── AddItemScreen
    │       │
    │       └── (navigate with state) ──┐
    │                                   │
    ├── Route: "/select-questions"     │
    │   └── SelectQuestionsScreen ◄────┘
    │       │
    │       └── (navigate with state) ──┐
    │                                   │
    ├── Route: "/answer-questions"     │
    │   └── AnswerQuestionsScreen ◄────┘
    │       │
    │       └── (navigate with state) ──┐
    │                                   │
    └── Route: "/success"              │
        └── SuccessScreen ◄─────────────┘
```

## State Management

```
Screen 1: AddItemScreen
    State: {
        founderId: "",
        category: "",
        description: ""
    }
    ↓ (passed via navigation)

Screen 2: SelectQuestionsScreen
    State: {
        ...previous,
        generatedQuestions: [],
        selectedQuestions: []
    }
    ↓ (passed via navigation)

Screen 3: AnswerQuestionsScreen
    State: {
        ...previous,
        answers: []
    }
    ↓ (saved to backend)

Screen 4: SuccessScreen
    State: {
        item: { ...all saved data from DB }
    }
```

## API Request/Response Flow

```
Generate Questions:
    Request:
    POST /api/questions/generate
    {
        "category": "Electronics",
        "description": "Found black smartphone..."
    }
    
    Response:
    {
        "success": true,
        "data": {
            "questions": [
                "What color is the phone case?",
                "What is the lock screen wallpaper?",
                ...
            ]
        }
    }

Create Item:
    Request:
    POST /api/items/create
    {
        "category": "Electronics",
        "description": "Found black smartphone...",
        "founderId": "FOUNDER001",
        "questions": [
            {"text": "...", "answer": "..."},
            ...
        ]
    }
    
    Response:
    {
        "success": true,
        "data": {
            "item": {
                "id": 12345,
                "category": "Electronics",
                ...
            }
        }
    }
```
