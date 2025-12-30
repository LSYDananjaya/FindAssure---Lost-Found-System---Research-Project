# Python Verification Service Integration

## Overview

The verification system uses a Python backend service to analyze owner answers against founder answers using both local NLP (SBERT, WMD, Jaccard, TF-IDF) and Google's Gemini AI. The Node.js backend acts as a proxy and integrates the Python service seamlessly.

## Architecture

```
Owner/Web UI → Node Backend → Python Backend (Flask) → Gemini AI
                    ↓                   ↓
                Database          Local NLP Models
```

## Setup Instructions

### 1. Python Backend Setup

1. Navigate to the Python backend directory:
   ```bash
   cd Similarity_python
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Create `.env` file in `Similarity_python/` directory:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. Start the Python backend:
   ```bash
   python app.py
   ```
   
   The service will run on `http://127.0.0.1:5000`

### 2. Node Backend Configuration

1. Navigate to the Backend directory:
   ```bash
   cd Backend
   ```

2. Add to your `.env` file (create if it doesn't exist):
   ```env
   # Existing variables...
   MONGODB_URI=your_mongodb_uri
   GEMINI_API_KEY=your_gemini_api_key
   
   # Python Backend URL
   PYTHON_BACKEND_URL=http://127.0.0.1:5000
   ```

3. Install dependencies (if not already done):
   ```bash
   npm install
   ```

4. Start the Node backend:
   ```bash
   npm run dev
   ```
   
   The service will run on `http://localhost:3000`

### 3. Frontend Configuration

#### Mobile App (FindAssure)
1. Update API base URL in `FindAssure/src/api/axiosClient.ts` if needed
2. Start the app:
   ```bash
   cd FindAssure
   npm install
   npx expo start
   ```

#### Web App
1. Update API base URL in `WebApp/src/services/api.ts` if needed
2. Start the web app:
   ```bash
   cd WebApp
   npm install
   npm run dev
   ```

## How It Works

### Request Flow

1. **Owner submits answers** through mobile or web UI
2. **Node backend receives request** at `/api/items/verification`
3. **Verification is saved to MongoDB** with status 'pending'
4. **Node backend calls Python service** at `http://127.0.0.1:5000/verify-owner`
5. **Python service analyzes answers** using:
   - Local NLP: SBERT, WMD, Jaccard, TF-IDF
   - Gemini AI: Semantic analysis and reasoning
6. **Python returns verification result** with confidence score
7. **Node backend updates verification** with results and status
8. **Frontend displays result** to user with founder contact (if verified)

### Request Format to Python Backend

```json
[
  {
    "owner_id": "user_12345",
    "category": "bag",
    "answers": [
      {
        "question_id": 1,
        "video_key": "owner_answer_one",
        "founder_answer": "It was a black backpack with a silver zipper.",
        "owner_answer": "My bag is a black backpack with a silver zip.",
        "question_text": "What color is your bag and describe its main features?"
      }
    ]
  }
]
```

### Response Format from Python Backend

```json
{
  "owner_id": "user_12345",
  "category": "bag",
  "average_local_score": "87%",
  "average_gemini_score": "94%",
  "final_confidence": "90%",
  "is_absolute_owner": true,
  "gemini_overall_score": "94%",
  "gemini_recommendation": "VERIFIED",
  "gemini_reasoning": "The owner's answers consistently match...",
  "results": [
    {
      "question_id": 1,
      "local_nlp_score": "81%",
      "gemini_score": "90%",
      "final_similarity": "85%",
      "status": "match",
      "local_explanation": "Owner answer strongly matches semantic meaning.",
      "gemini_analysis": "The owner's description is consistent..."
    }
  ]
}
```

## Verification Decision Logic

- **`is_absolute_owner: true`**: Final confidence ≥ 70%
  - Status set to 'passed'
  - Found item status changed to 'claimed'
  - Founder contact information shown to owner
  - Success message displayed

- **`is_absolute_owner: false`**: Final confidence < 70%
  - Status set to 'failed'
  - Found item status reverted to 'available'
  - Retry message displayed
  - Founder contact hidden

## Database Schema Updates

### Verification Model
```typescript
{
  foundItemId: ObjectId,
  ownerId: ObjectId,
  answers: [
    {
      questionId: number,
      question: string,
      founderAnswer: string,
      ownerAnswer: string,
      videoKey: string
    }
  ],
  status: 'pending' | 'passed' | 'failed',
  similarityScore: number,
  pythonVerificationResult: {
    // Complete Python response stored here
  },
  createdAt: Date,
  updatedAt: Date
}
```

## API Endpoints

### Node Backend

#### POST `/api/items/verification`
Create verification and trigger Python analysis

**Request:**
```json
{
  "foundItemId": "67890...",
  "ownerAnswers": [
    {
      "questionId": 0,
      "answer": "My bag is black with a silver zip",
      "videoKey": "default_video_placeholder"
    }
  ]
}
```

**Response:**
```json
{
  "_id": "verification_id",
  "foundItemId": "67890...",
  "ownerId": "12345...",
  "status": "passed",
  "similarityScore": 0.90,
  "pythonVerificationResult": {
    // Full Python response
  }
}
```

#### GET `/api/items/verification/:id`
Get verification result by ID

**Response includes:**
- Verification details
- Python verification results
- Found item details (with founder contact if verified)

## UI Components

### Mobile (React Native)
- **VerificationResultScreen**: Shows verification result, confidence score, AI analysis, and founder contact (if verified)

### Web (React)
- **VerificationResultPage**: Shows verification result with detailed question analysis and contact information

## Error Handling

### Python Service Not Running
```
Error: Python verification service is not responding. 
Please ensure the Python backend is running.
```

**Solution:** Start the Python backend with `python app.py`

### Gemini API Issues
```
Error: Gemini verification failed
```

**Solution:** Check Gemini API key in `.env` file

### Timeout Issues
The Python service has a 60-second timeout for AI processing. If verification takes longer, consider:
- Reducing number of questions
- Optimizing Gemini API calls
- Increasing timeout in `pythonVerificationService.ts`

## Testing

### Test the Complete Flow

1. **Start all services:**
   ```bash
   # Terminal 1: Python Backend
   cd Similarity_python
   python app.py
   
   # Terminal 2: Node Backend
   cd Backend
   npm run dev
   
   # Terminal 3: Mobile or Web
   cd FindAssure  # or WebApp
   npm run dev
   ```

2. **Test verification:**
   - Report a found item (founder flow)
   - Search for the item (owner flow)
   - Answer verification questions
   - Check verification result screen

3. **Verify database:**
   ```javascript
   // In MongoDB
   db.verifications.findOne()
   ```

### Manual API Testing

```bash
# Test Python backend directly
curl -X POST http://127.0.0.1:5000/verify-owner \
  -H "Content-Type: application/json" \
  -d '[{
    "owner_id": "test123",
    "category": "bag",
    "answers": [{
      "question_id": 1,
      "video_key": "test",
      "founder_answer": "Black backpack",
      "owner_answer": "Black bag"
    }]
  }]'
```

## Performance Considerations

- **Average processing time**: 5-15 seconds per verification
- **Depends on:**
  - Number of questions (5 is optimal)
  - Gemini API response time
  - Network latency

## Security Considerations

- Python backend should be run on a trusted server
- Consider authentication between Node and Python backends in production
- Validate all inputs before sending to Python service
- Sanitize outputs from Python service before displaying to users

## Future Enhancements

1. **Video Analysis**: Replace text answers with actual video recordings
2. **Real-time Updates**: Use WebSockets for live verification status
3. **Caching**: Cache Python verification results to avoid reprocessing
4. **Load Balancing**: Scale Python backend for multiple concurrent verifications
5. **Monitoring**: Add logging and analytics for verification success rates

## Troubleshooting

### Issue: Verification stuck in 'pending' status
- Check if Python backend is running
- Check Node backend logs for errors
- Verify network connectivity between services

### Issue: Low confidence scores
- Ensure questions are specific and detailed
- Encourage founders to provide comprehensive answers
- Review Gemini API responses for quality

### Issue: Frontend not showing results
- Verify navigation to VerificationResult screen/page
- Check browser console for errors
- Ensure verification ID is passed correctly

## Support

For issues or questions:
1. Check logs in both Node and Python backends
2. Verify all environment variables are set
3. Ensure all services are running
4. Review API responses for error messages
