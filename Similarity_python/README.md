# Similarity Python Backend

This Python Flask backend provides similarity checking for lost and found item verification using both local NLP and Gemini AI.

## Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure Environment Variables

Create a `.env` file in the `Similarity_python` folder:

```bash
cp .env.example .env
```

Then edit `.env` and add your Gemini API key:

```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
FLASK_ENV=development
FLASK_DEBUG=True
```

**Important:** Never commit the `.env` file to git. It's already included in `.gitignore`.

### 3. Run the Server

```bash
python app.py
```

## API Endpoints

### POST /verify-owner

Verifies if the owner's answers match the founder's answers for a lost item.

**Request Body:**
```json
{
  "owner_id": "string",
  "category": "string",
  "answers": [
    {
      "question_text": "string",
      "founder_answer": "string",
      "owner_answer": "string"
    }
  ]
}
```

**Response:**
```json
{
  "verification_status": "VERIFIED | PARTIAL_MATCH | REJECTED",
  "overall_confidence": "85%",
  "results": [...],
  "gemini_analysis": {...}
}
```

## Security Notes

- API keys are stored in `.env` file (not tracked by git)
- `.env.example` provides a template without sensitive data
- Always use `.env` for local development
- Use environment variables for production deployment
