# Verification System - Quick Reference

## Quick Start (3 Steps)

### 1. Start Python Backend
```bash
cd Similarity_python
python app.py
# Runs on http://127.0.0.1:5000
```

### 2. Start Node Backend
```bash
cd Backend
npm run dev
# Runs on http://localhost:3000
```

### 3. Start Frontend
```bash
# Mobile
cd FindAssure
npx expo start

# OR Web
cd WebApp
npm run dev
```

## Environment Variables

### Backend/.env
```env
PYTHON_BACKEND_URL=http://127.0.0.1:5000
MONGODB_URI=your_mongodb_uri
GEMINI_API_KEY=your_gemini_key
```

### Similarity_python/.env
```env
GEMINI_API_KEY=your_gemini_key
```

## Verification Flow

1. **Owner answers questions** → Mobile/Web UI
2. **POST** `/api/items/verification` → Node Backend
3. **Saves to MongoDB** → Status: 'pending'
4. **POST** `http://127.0.0.1:5000/verify-owner` → Python Backend
5. **AI Analysis** → Gemini + Local NLP
6. **Updates MongoDB** → Status: 'passed' or 'failed'
7. **Shows result** → Mobile/Web UI with founder contact

## Key Decision Point

```
if (is_absolute_owner === true && final_confidence >= 70%)
  → Status: 'passed'
  → Show founder contact
  → Item status: 'claimed'
else
  → Status: 'failed'
  → Hide founder contact
  → Show "Try again" message
  → Item status: 'available'
```

## Files Modified/Created

### Backend
- ✅ `src/services/pythonVerificationService.ts` - NEW
- ✅ `src/services/verificationService.ts` - UPDATED
- ✅ `src/models/Verification.ts` - UPDATED

### Mobile (FindAssure)
- ✅ `src/screens/owner/VerificationResultScreen.tsx` - NEW
- ✅ `src/navigation/RootNavigator.tsx` - UPDATED
- ✅ `src/types/models.ts` - UPDATED
- ✅ `src/screens/owner/AnswerQuestionsVideoScreen.tsx` - UPDATED

### Web
- ✅ `src/pages/VerificationResult.tsx` - NEW
- ✅ `src/pages/VerificationResult.css` - NEW
- ✅ `src/pages/ItemDetail.tsx` - UPDATED
- ✅ `src/App.tsx` - UPDATED

## API Endpoints

### POST `/api/items/verification`
**Request:**
```json
{
  "foundItemId": "item_id",
  "ownerAnswers": [
    {"questionId": 0, "answer": "...", "videoKey": "..."}
  ]
}
```

**Response:**
```json
{
  "_id": "verification_id",
  "status": "passed",
  "similarityScore": 0.90,
  "pythonVerificationResult": { /* full response */ }
}
```

### GET `/api/items/verification/:id`
**Response includes:**
- Verification details
- Python results
- Found item with founder contact (if verified)

## UI Screens

### Mobile: `VerificationResult`
- Shows ✅/❌ status
- Displays confidence score
- Shows AI reasoning
- Founder contact (if verified)
- Question-by-question analysis

### Web: `/verification/:verificationId`
- Same features as mobile
- Responsive design
- Direct email/phone links

## Python Backend Response Structure

```json
{
  "final_confidence": "90%",
  "is_absolute_owner": true,
  "gemini_recommendation": "VERIFIED",
  "gemini_reasoning": "...",
  "results": [
    {
      "question_id": 1,
      "final_similarity": "85%",
      "status": "match",
      "gemini_analysis": "..."
    }
  ]
}
```

## Common Issues & Solutions

### ❌ Python service not responding
```bash
# Check if running
curl http://127.0.0.1:5000/verify-owner

# Restart
cd Similarity_python
python app.py
```

### ❌ Verification stuck in 'pending'
- Check Python backend logs
- Verify `PYTHON_BACKEND_URL` in Backend/.env
- Ensure network connectivity

### ❌ No founder contact shown (when verified)
- Check `is_absolute_owner` field in response
- Verify `status === 'passed'`
- Check frontend conditional rendering

## Testing Verification

### 1. Complete Flow Test
```bash
# Terminal 1
cd Similarity_python && python app.py

# Terminal 2
cd Backend && npm run dev

# Terminal 3
cd FindAssure && npx expo start
# OR
cd WebApp && npm run dev
```

### 2. Test Python Backend Directly
```bash
curl -X POST http://127.0.0.1:5000/verify-owner \
  -H "Content-Type: application/json" \
  -d '[{
    "owner_id": "test",
    "category": "bag",
    "answers": [{
      "question_id": 1,
      "video_key": "test",
      "founder_answer": "Black backpack",
      "owner_answer": "Black backpack"
    }]
  }]'
```

### 3. Check Database
```javascript
// MongoDB
db.verifications.find().sort({createdAt: -1}).limit(1)

// Check for:
// - status: 'passed' or 'failed'
// - similarityScore: number
// - pythonVerificationResult: object
```

## Navigation Paths

### Mobile
```
AnswerQuestionsVideo → VerificationResult (with verificationId)
```

### Web
```
/item/:id → /verification/:verificationId
```

## Conditional Display Logic

### Show Founder Contact When:
```typescript
isVerified = 
  verification.status === 'passed' && 
  pythonResult?.is_absolute_owner === true
```

### Show Retry Message When:
```typescript
!isVerified
```

## Performance Metrics

- **Average Time:** 5-15 seconds
- **Timeout:** 60 seconds
- **Optimal Questions:** 5
- **Confidence Threshold:** 70%

## Quick Debugging

```bash
# Check Python backend
curl http://127.0.0.1:5000/verify-owner

# Check Node backend
curl http://localhost:3000/api/items/found

# Check frontend logs
# Mobile: Metro bundler console
# Web: Browser DevTools console

# Check database
mongosh
use findassure
db.verifications.find()
```

## Next Steps After Setup

1. ✅ Start all three services (Python, Node, Frontend)
2. ✅ Test founder flow: Report found item
3. ✅ Test owner flow: Search and answer questions
4. ✅ Verify result screen shows correct information
5. ✅ Check database for verification records

## Production Considerations

- [ ] Add authentication between Node ↔ Python
- [ ] Deploy Python service separately
- [ ] Add retry logic for Python service
- [ ] Implement rate limiting
- [ ] Add monitoring/logging
- [ ] Cache verification results
- [ ] Add WebSocket for real-time updates

## Support Resources

- Full Guide: `PYTHON_VERIFICATION_INTEGRATION.md`
- Backend Code: `Backend/src/services/pythonVerificationService.ts`
- Python Code: `Similarity_python/app.py`
- Mobile Screen: `FindAssure/src/screens/owner/VerificationResultScreen.tsx`
- Web Page: `WebApp/src/pages/VerificationResult.tsx`
