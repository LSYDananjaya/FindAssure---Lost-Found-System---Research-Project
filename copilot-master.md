You are GitHub Copilot. Generate a full-stack project scaffold and implementation plan for the following system:

TITLE:
AI-Driven Lost & Found Verification System – Phase 1 Implementation

OBJECTIVE (Phase 1):
Build the Founder Flow:
1. Founder enters item category + description.
2. System generates 8–10 AI-based verification questions using Claude Sonnet API.
3. Founder selects preferred questions.
4. Founder answers those selected questions.
5. System saves:
   - item details (category, description, founderId)
   - selected questions
   - founder answers
   - timestamps
   into a database.
6. System exposes REST APIs so that a future Claim Verification Service can use these stored values.

---

## HIGH-LEVEL ARCHITECTURE (required)
Generate a microservice-friendly architecture such that this service can stand alone later:

services/
  ai-question-service/  ← build this fully now
  (future) vision-category-service/
  (future) similarity-service/
  (future) claim-service/
mobile/
  flutter_app/

Focus only on `ai-question-service` and Flutter app now, but structure must support microservices later.

---

## ai-question-service REQUIREMENTS (Node.js + Express)
Copilot must generate:
- Folder structure
- Controllers
- Routes
- DB layer
- Utils
- Config files

### Required Features:
1. POST /api/questions/generate  
   → Accepts {category, description}  
   → Calls Claude Sonnet API  
   → Returns array of question strings in JSON

2. POST /api/items/create  
   → Accepts {category, description, founderId, questions: [ {question, founderAnswer} ]}  
   → Stores into DB (PostgreSQL)

3. GET /api/items/:itemId  
   → Returns item + questions for debugging/testing

### Required Files:
- src/server.js
- src/routes/questions.js
- src/routes/items.js
- src/controllers/questionsController.js
- src/controllers/itemsController.js
- src/utils/claudeClient.js
- src/db/index.js
- package.json
- .env.example
- README.md

### Database:
PostgreSQL schema:
- items (id, category, description, founder_id, created_at)
- item_questions (id, item_id, question, founder_answer)

Generate SQL schema.

---

## FLUTTER APP REQUIREMENTS
Copilot must generate:
- Screens for Founder Flow
- Models
- Services
- Navigation logic
- API integration

### Screens:
1. AddItemScreen  
   → Inputs: category, description  
   → Button: Generate Questions

2. SelectQuestionsScreen  
   → Checkbox list of AI-generated questions  
   → Button: Continue

3. AnswerQuestionsScreen  
   → TextFields to enter answers  
   → Button: Save Item

4. ItemSuccessScreen  
   → Shows itemId

### Required Files:
lib/
  main.dart
  models/question.dart
  models/item.dart
  services/api_service.dart
  screens/add_item_screen.dart
  screens/select_questions_screen.dart
  screens/answer_questions_screen.dart
  screens/item_success_screen.dart

APIs:
- generateQuestions()
- createItem()

---

## PROJECT FLOW (Copilot follow)
STEP 1 — Setup backend folder structure  
STEP 2 — Setup Express server  
STEP 3 — Add DB module + SQL schema  
STEP 4 — Implement Claude Sonnet client  
STEP 5 — Implement question generation route  
STEP 6 — Implement item create route  
STEP 7 — Implement get item route  
STEP 8 — Add environment config + README  

STEP 9 — Setup Flutter app  
STEP 10 — Build UI screens (4 screens)  
STEP 11 — Build HTTP service layer  
STEP 12 — Connect UI → API → flows  
STEP 13 — Create final application flow summary  

---

## FINAL OUTPUT FORMAT
Copilot must generate:
- All folder structures
- All necessary code files
- Database schema
- Sample API requests
- Integration explanations
- Final summary of how to run project

DO NOT generate placeholder text.
Provide real file contents and comments.

Begin now.
