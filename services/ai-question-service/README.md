# AI Question Service

AI-powered question generation service for the Lost & Found Verification System. This microservice generates verification questions using Claude Sonnet API and manages item storage with PostgreSQL.

## Features

- 🤖 AI-powered question generation using Claude Sonnet
- 📝 RESTful API for item management
- 🗄️ PostgreSQL database integration
- 🔒 Transaction-safe data storage
- ✅ Input validation and error handling
- 🚀 Microservice-ready architecture

## Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v13 or higher)
- Claude API key from Anthropic

## Installation

1. **Clone and navigate to the service:**
   ```bash
   cd services/ai-question-service
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your credentials:
   ```env
   PORT=3000
   NODE_ENV=development
   
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=lost_found_db
   DB_USER=postgres
   DB_PASSWORD=your_password_here
   
   CLAUDE_API_KEY=your_claude_api_key_here
   CLAUDE_MODEL=claude-sonnet-4-20250514
   
   CORS_ORIGIN=http://localhost:8080
   ```

4. **Setup database:**
   ```bash
   # Create database
   psql -U postgres
   CREATE DATABASE lost_found_db;
   \q
   
   # Run schema setup
   npm run db:setup
   ```

## Running the Service

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The service will be available at `http://localhost:3000`

## API Endpoints

### 1. Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "service": "ai-question-service",
  "timestamp": "2025-11-18T10:30:00.000Z"
}
```

---

### 2. Generate Verification Questions
```http
POST /api/questions/generate
Content-Type: application/json

{
  "category": "Electronics",
  "description": "Black iPhone 13 Pro with blue protective case. Screen has minor scratches on bottom left corner."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Questions generated successfully",
  "data": {
    "questions": [
      "What is the exact model of the iPhone?",
      "What color is the protective case?",
      "Where are the scratches located on the screen?",
      "What is the storage capacity of the device?",
      "Are there any stickers or custom decorations on the case?",
      "What is the phone's wallpaper or lock screen image?",
      "What are the first few apps on the home screen?",
      "Is there a SIM card in the device?"
    ]
  },
  "timestamp": "2025-11-18T10:30:00.000Z"
}
```

---

### 3. Create Item with Questions
```http
POST /api/items/create
Content-Type: application/json

{
  "category": "Electronics",
  "description": "Black iPhone 13 Pro with blue protective case",
  "founderId": "founder_12345",
  "questions": [
    {
      "question": "What is the exact model of the iPhone?",
      "founderAnswer": "iPhone 13 Pro"
    },
    {
      "question": "What color is the protective case?",
      "founderAnswer": "Blue"
    },
    {
      "question": "Where are the scratches located on the screen?",
      "founderAnswer": "Bottom left corner"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Item created successfully",
  "data": {
    "item": {
      "id": 1,
      "category": "Electronics",
      "description": "Black iPhone 13 Pro with blue protective case",
      "founderId": "founder_12345",
      "createdAt": "2025-11-18T10:30:00.000Z",
      "questions": [
        {
          "id": 1,
          "question": "What is the exact model of the iPhone?",
          "founder_answer": "iPhone 13 Pro",
          "created_at": "2025-11-18T10:30:00.000Z"
        }
      ]
    }
  },
  "timestamp": "2025-11-18T10:30:00.000Z"
}
```

---

### 4. Get Item by ID
```http
GET /api/items/1
```

**Response:**
```json
{
  "success": true,
  "message": "Item retrieved successfully",
  "data": {
    "item": {
      "id": 1,
      "category": "Electronics",
      "description": "Black iPhone 13 Pro with blue protective case",
      "founderId": "founder_12345",
      "createdAt": "2025-11-18T10:30:00.000Z",
      "updatedAt": "2025-11-18T10:30:00.000Z",
      "questions": [
        {
          "id": 1,
          "question": "What is the exact model of the iPhone?",
          "founder_answer": "iPhone 13 Pro",
          "created_at": "2025-11-18T10:30:00.000Z"
        }
      ]
    }
  },
  "timestamp": "2025-11-18T10:30:00.000Z"
}
```

---

### 5. Get All Items
```http
GET /api/items
```

**Response:**
```json
{
  "success": true,
  "message": "Items retrieved successfully",
  "data": {
    "items": [
      {
        "id": 1,
        "category": "Electronics",
        "description": "Black iPhone 13 Pro with blue protective case",
        "founder_id": "founder_12345",
        "created_at": "2025-11-18T10:30:00.000Z"
      }
    ],
    "count": 1
  },
  "timestamp": "2025-11-18T10:30:00.000Z"
}
```

## Database Schema

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

## Project Structure

```
ai-question-service/
├── src/
│   ├── config/
│   │   ├── database.js         # Database configuration
│   │   └── claude.js           # Claude API configuration
│   ├── controllers/
│   │   ├── questionsController.js  # Question generation logic
│   │   └── itemsController.js      # Item management logic
│   ├── db/
│   │   ├── index.js            # Database connection pool
│   │   ├── schema.sql          # Database schema
│   │   └── setup.js            # Database setup script
│   ├── routes/
│   │   ├── questions.js        # Question routes
│   │   └── items.js            # Item routes
│   ├── utils/
│   │   ├── claudeClient.js     # Claude API client
│   │   └── responseHandler.js  # Response formatting utilities
│   └── server.js               # Express server entry point
├── .env.example                # Environment variables template
├── .gitignore
├── package.json
└── README.md
```

## Error Handling

All API responses follow a consistent format:

**Success Response:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "timestamp": "2025-11-18T10:30:00.000Z"
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error description",
  "timestamp": "2025-11-18T10:30:00.000Z"
}
```

## Testing the API

Using curl:
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
    "questions":[
      {"question":"What model?","founderAnswer":"iPhone 13"}
    ]
  }'

# Get item
curl http://localhost:3000/api/items/1
```

## Future Integration

This service is designed to be consumed by:
- **Claim Verification Service** - Will fetch stored questions to verify claimants
- **Vision Category Service** - Will use AI to categorize items from images
- **Similarity Service** - Will match lost items with found items

## Contributing

This is Phase 1 of the Lost & Found Verification System. Future phases will add claim verification, image analysis, and similarity matching.

## License

MIT
