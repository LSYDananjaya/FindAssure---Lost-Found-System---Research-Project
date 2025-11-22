# 📐 SYSTEM ARCHITECTURE & DIAGRAMS

## 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     AI-DRIVEN LOST & FOUND SYSTEM                │
│                         PHASE 1 ARCHITECTURE                      │
└─────────────────────────────────────────────────────────────────┘

┌───────────────────┐
│  Mobile Device    │
│  (Flutter App)    │
│                   │
│  ┌─────────────┐ │
│  │ UI Screens  │ │      HTTP/REST
│  │  (4 screens)│ │◄────────────────┐
│  └─────────────┘ │                 │
│        │          │                 │
│  ┌─────▼────────┐│                 │
│  │ API Service  ││                 │
│  │ (HTTP Client)││                 │
│  └──────────────┘│                 │
└───────────────────┘                 │
                                      │
        ┌─────────────────────────────┘
        │
        │
        ▼
┌───────────────────────────────────────────────────────────┐
│           AI QUESTION SERVICE (Backend)                    │
│                                                            │
│  ┌──────────────┐    ┌──────────────┐   ┌─────────────┐ │
│  │  Express.js  │───▶│ Controllers  │──▶│   Routes    │ │
│  │    Server    │    │   (Logic)    │   │  (API)      │ │
│  └──────────────┘    └──────┬───────┘   └─────────────┘ │
│                              │                            │
│                    ┌─────────┴─────────┐                 │
│                    │                   │                 │
│            ┌───────▼──────┐    ┌──────▼────────┐        │
│            │ Claude Client│    │  DB Layer     │        │
│            │  (AI Utils)  │    │  (pg pool)    │        │
│            └──────┬───────┘    └──────┬────────┘        │
└────────────────────┼──────────────────┼──────────────────┘
                     │                  │
                     │                  │
            ┌────────▼────────┐  ┌──────▼────────┐
            │  Claude Sonnet  │  │  PostgreSQL   │
            │  API (Anthropic)│  │   Database    │
            │                 │  │               │
            │ • Generate Q's  │  │ • items       │
            └─────────────────┘  │ • item_questions│
                                 └───────────────┘
```

---

## 🔄 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    FOUNDER FLOW - DATA JOURNEY                   │
└─────────────────────────────────────────────────────────────────┘

1. ITEM INPUT
   ┌─────────────┐
   │   Founder   │
   │ enters data │
   └──────┬──────┘
          │ { category: "Electronics",
          │   description: "Black iPhone..." }
          ▼
   ┌─────────────┐
   │ Add Item    │
   │  Screen     │
   └──────┬──────┘
          │
          │ POST /api/questions/generate
          │ { category, description }
          │
          ▼
   ┌─────────────────┐
   │  Questions      │
   │  Controller     │
   └────────┬────────┘
            │
            │ generateVerificationQuestions()
            │
            ▼
   ┌─────────────────┐
   │  Claude Sonnet  │───► [Generates 8-10 questions]
   │     API         │
   └────────┬────────┘
            │
            │ Response: ["Question 1", "Question 2", ...]
            │
            ▼
   ┌─────────────────┐
   │  Questions      │
   │  Controller     │
   └────────┬────────┘
            │
            │ { success: true, data: { questions: [...] } }
            │
            ▼

2. QUESTION SELECTION
   ┌─────────────┐
   │  Select     │
   │ Questions   │◄─── User sees 8-10 questions
   │  Screen     │
   └──────┬──────┘
          │
          │ User selects 3-4 questions
          │
          ▼

3. ANSWER INPUT
   ┌─────────────┐
   │  Answer     │
   │ Questions   │◄─── User provides answers
   │  Screen     │
   └──────┬──────┘
          │
          │ POST /api/items/create
          │ {
          │   category, description, founderId,
          │   questions: [
          │     { question: "...", founderAnswer: "..." }
          │   ]
          │ }
          │
          ▼
   ┌─────────────────┐
   │  Items          │
   │  Controller     │
   └────────┬────────┘
            │
            │ BEGIN TRANSACTION
            │
            ▼
   ┌─────────────────┐
   │  PostgreSQL     │
   │                 │
   │  1. INSERT INTO items
   │     → Returns item.id
   │                 │
   │  2. INSERT INTO item_questions
   │     (for each Q&A)
   │                 │
   │  3. COMMIT      │
   └────────┬────────┘
            │
            │ { item: { id: 1, category, ... } }
            │
            ▼

4. SUCCESS CONFIRMATION
   ┌─────────────┐
   │  Success    │
   │  Screen     │◄─── Shows Item ID #1
   └─────────────┘
```

---

## 🗄️ Database Entity Relationship Diagram

```
┌──────────────────────────────────────────────────────┐
│                     DATABASE SCHEMA                   │
│                    (PostgreSQL)                       │
└──────────────────────────────────────────────────────┘

┌────────────────────────┐
│       items            │
├────────────────────────┤
│ id (PK)        SERIAL  │───┐
│ category       VARCHAR │   │
│ description    TEXT    │   │
│ founder_id     VARCHAR │   │
│ created_at     TIMESTAMP│  │
│ updated_at     TIMESTAMP│  │
└────────────────────────┘   │
                             │
                             │ ONE-TO-MANY
                             │ (CASCADE DELETE)
                             │
                             │
┌────────────────────────┐   │
│  item_questions        │   │
├────────────────────────┤   │
│ id (PK)        SERIAL  │   │
│ item_id (FK)   INTEGER │───┘
│ question       TEXT    │
│ founder_answer TEXT    │
│ created_at     TIMESTAMP│
└────────────────────────┘

INDEXES:
  • items: founder_id, category, created_at
  • item_questions: item_id

CONSTRAINTS:
  • item_questions.item_id REFERENCES items.id ON DELETE CASCADE
  • All fields NOT NULL (except updated_at)

TRIGGERS:
  • update_items_updated_at (auto-updates timestamp)
```

---

## 📱 Mobile App Screen Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     MOBILE APP - 4 SCREEN FLOW                   │
└─────────────────────────────────────────────────────────────────┘

SCREEN 1: ADD ITEM
╔══════════════════════════╗
║  Report Found Item       ║
╠══════════════════════════╣
║ 🔍                       ║
║                          ║
║ Your ID:                 ║
║ [_____________________]  ║
║                          ║
║ Category:                ║
║ [Electronics      ▼]     ║
║                          ║
║ Description:             ║
║ [_____________________]  ║
║ [_____________________]  ║
║ [_____________________]  ║
║                          ║
║ [Generate Questions]     ║
╚══════════════════════════╝
           │
           │ API Call
           ▼

SCREEN 2: SELECT QUESTIONS
╔══════════════════════════╗
║  Select Questions        ║
╠══════════════════════════╣
║ ✓ Selected: 3            ║
║ ─────────────────────    ║
║ ☐ What model is it?      ║
║ ☑ What color is case?    ║
║ ☑ Any scratches?         ║
║ ☐ Screen size?           ║
║ ☑ Any stickers?          ║
║ ☐ Where found?           ║
║ ☐ When found?            ║
║ ☐ Battery level?         ║
║                          ║
║ [Continue (3)]           ║
╚══════════════════════════╝
           │
           │ Navigate
           ▼

SCREEN 3: ANSWER QUESTIONS
╔══════════════════════════╗
║  Answer Questions        ║
╠══════════════════════════╣
║ ① What color is case?    ║
║ [Blue                 ]  ║
║                          ║
║ ② Any scratches?         ║
║ [Small scratch on     ]  ║
║ [bottom left corner   ]  ║
║                          ║
║ ③ Any stickers?          ║
║ [Batman sticker on    ]  ║
║ [back                 ]  ║
║                          ║
║ [Save Item]              ║
╚══════════════════════════╝
           │
           │ API Call
           ▼

SCREEN 4: SUCCESS
╔══════════════════════════╗
║  Success! ✓              ║
╠══════════════════════════╣
║ ┌────────────────────┐   ║
║ │     Item ID        │   ║
║ │       #1    📋     │   ║
║ └────────────────────┘   ║
║                          ║
║ Category: Electronics    ║
║ Questions: 3             ║
║ Created: Just now        ║
║                          ║
║ ℹ️ What's Next?          ║
║ The owner will need to   ║
║ answer these questions   ║
║                          ║
║ [Report Another]         ║
║ [Back to Home]           ║
╚══════════════════════════╝
```

---

## 🔌 API Request/Response Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                API ENDPOINT REQUEST/RESPONSE CYCLE               │
└─────────────────────────────────────────────────────────────────┘

ENDPOINT 1: Generate Questions
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

REQUEST:
  POST /api/questions/generate
  Content-Type: application/json
  
  {
    "category": "Electronics",
    "description": "Black iPhone 13 Pro with blue case"
  }

  ↓ Route Handler
  ↓ Validation (express-validator)
  ↓ Controller (questionsController.generateQuestions)
  ↓ Claude Client (generateVerificationQuestions)
  ↓ Claude API Call
  ↓ Parse Response
  ↓ Format & Return

RESPONSE:
  200 OK
  Content-Type: application/json
  
  {
    "success": true,
    "message": "Questions generated successfully",
    "data": {
      "questions": [
        "What is the exact model of the phone?",
        "What color is the protective case?",
        "Where are the scratches located?",
        "What is the storage capacity?",
        "Are there any stickers?",
        "What's the lock screen?",
        "What apps are on home screen?",
        "Is there a SIM card?"
      ]
    },
    "timestamp": "2025-11-18T10:30:00.000Z"
  }

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ENDPOINT 2: Create Item
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

REQUEST:
  POST /api/items/create
  Content-Type: application/json
  
  {
    "category": "Electronics",
    "description": "Black iPhone 13 Pro",
    "founderId": "founder_123",
    "questions": [
      {
        "question": "What color is the case?",
        "founderAnswer": "Blue"
      },
      {
        "question": "Any scratches?",
        "founderAnswer": "Bottom left corner"
      }
    ]
  }

  ↓ Route Handler
  ↓ Validation
  ↓ Controller (itemsController.createItem)
  ↓ Get DB Client
  ↓ BEGIN TRANSACTION
  ↓ INSERT INTO items
  ↓ INSERT INTO item_questions (loop)
  ↓ COMMIT TRANSACTION
  ↓ Format & Return

RESPONSE:
  201 Created
  Content-Type: application/json
  
  {
    "success": true,
    "message": "Item created successfully",
    "data": {
      "item": {
        "id": 1,
        "category": "Electronics",
        "description": "Black iPhone 13 Pro",
        "founderId": "founder_123",
        "createdAt": "2025-11-18T10:30:00.000Z",
        "questions": [
          {
            "id": 1,
            "question": "What color is the case?",
            "founder_answer": "Blue",
            "created_at": "2025-11-18T10:30:00.000Z"
          },
          {
            "id": 2,
            "question": "Any scratches?",
            "founder_answer": "Bottom left corner",
            "created_at": "2025-11-18T10:30:00.000Z"
          }
        ]
      }
    },
    "timestamp": "2025-11-18T10:30:00.000Z"
  }
```

---

## 🧩 Component Interaction Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│              COMPONENT INTERACTION - PHASE 1                     │
└─────────────────────────────────────────────────────────────────┘

MOBILE APP LAYER
─────────────────────────────────────
┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│   Screen 1  │──▶│   Screen 2  │──▶│   Screen 3  │──▶│   Screen 4  │
│  Add Item   │   │   Select    │   │   Answer    │   │   Success   │
└──────┬──────┘   └──────┬──────┘   └──────┬──────┘   └─────────────┘
       │                 │                 │
       │                 │                 │
       └─────────────────┴─────────────────┘
                         │
                    ┌────▼─────┐
                    │   API    │
                    │ Service  │
                    └────┬─────┘
                         │ HTTP/REST
━━━━━━━━━━━━━━━━━━━━━━━━┿━━━━━━━━━━━━━━━━━━━━━━━━━━━
                         │
BACKEND LAYER            │
─────────────────────────▼───────────────────────────
                    ┌────────────┐
                    │  Express   │
                    │   Routes   │
                    └─────┬──────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
   ┌────▼─────┐    ┌──────▼──────┐   ┌────▼─────┐
   │Questions │    │    Items    │   │  Health  │
   │Controller│    │ Controller  │   │  Check   │
   └────┬─────┘    └──────┬──────┘   └──────────┘
        │                 │
        │                 │
   ┌────▼─────┐    ┌──────▼──────┐
   │  Claude  │    │  Database   │
   │  Client  │    │   Layer     │
   └────┬─────┘    └──────┬──────┘
        │                 │
━━━━━━━━┿━━━━━━━━━━━━━━━━┿━━━━━━━━━━━━━━━━━━━━━━━━━━
        │                 │
EXTERNAL│SERVICES         │
─────────▼─────────────────▼───────────────────────────
   ┌──────────┐      ┌──────────┐
   │  Claude  │      │PostgreSQL│
   │  Sonnet  │      │ Database │
   │   API    │      │          │
   └──────────┘      └──────────┘
```

---

## 🔐 Security & Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    SECURITY CONSIDERATIONS                       │
└─────────────────────────────────────────────────────────────────┘

MOBILE APP
──────────────────────────────
  • HTTPS recommended for production
  • Input validation before API calls
  • Error message sanitization
  • No sensitive data in UI state

         │ HTTPS (recommended)
         │ JSON payload
         ▼

API LAYER
──────────────────────────────
  • CORS configuration
  • express-validator middleware
  • Request sanitization
  • Rate limiting (future)
  • Authentication (future)

         │
         ▼

BUSINESS LOGIC
──────────────────────────────
  • Input validation
  • SQL injection prevention (parameterized queries)
  • Transaction safety
  • Error handling

         │
         ▼

DATABASE
──────────────────────────────
  • Connection pooling
  • Prepared statements
  • Foreign key constraints
  • Cascade delete rules
  • Auto-updating timestamps

         │
         ▼

EXTERNAL API (Claude)
──────────────────────────────
  • API key in environment variables
  • Request/response validation
  • Error handling
  • Rate limiting awareness
```

---

## 📊 Future Architecture (Phase 2+)

```
┌─────────────────────────────────────────────────────────────────┐
│              FUTURE MICROSERVICES ARCHITECTURE                   │
│                         (Phase 2-3)                              │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐
│ Flutter App  │
└──────┬───────┘
       │
       │ API Gateway (future)
       │
       ▼
┌──────────────────────────────────────────────────────────────┐
│                    MICROSERVICES LAYER                        │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   AI Q&A    │  │   Vision    │  │ Similarity  │         │
│  │  Service    │  │  Category   │  │  Matching   │         │
│  │  (Current)  │  │  Service    │  │  Service    │         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘         │
│         │                │                │                 │
│  ┌──────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐         │
│  │   Claim     │  │    Auth     │  │Notification │         │
│  │Verification │  │  Service    │  │  Service    │         │
│  │  Service    │  │             │  │             │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                               │
└───────────────────────────┬───────────────────────────────────┘
                            │
                    ┌───────▼────────┐
                    │   PostgreSQL   │
                    │   (Multiple    │
                    │   Databases)   │
                    └────────────────┘
```

---

**Architecture documentation complete! 📐**

These diagrams show:
- ✅ System architecture
- ✅ Data flow
- ✅ Database schema
- ✅ Screen flow
- ✅ API flow
- ✅ Component interaction
- ✅ Security layers
- ✅ Future expansion
