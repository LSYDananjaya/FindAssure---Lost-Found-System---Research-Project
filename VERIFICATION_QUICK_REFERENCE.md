# Quick Reference: Unified Verification Structure

## What Changed?

### Old Format (Separate Arrays)
```json
{
  "questions": ["Q1", "Q2", "Q3"],
  "founderAnswers": ["FA1", "FA2", "FA3"],
  "ownerVideoAnswers": [
    {"question": "Q1", "videoUrl": "OA1"},
    {"question": "Q2", "videoUrl": "OA2"}
  ]
}
```

### New Format (Unified Array)
```json
{
  "answers": [
    {
      "questionId": 0,
      "question": "Q1",
      "founderAnswer": "FA1",
      "ownerAnswer": "OA1",
      "videoKey": "default_video_placeholder"
    },
    {
      "questionId": 1,
      "question": "Q2",
      "founderAnswer": "FA2",
      "ownerAnswer": "OA2",
      "videoKey": "default_video_placeholder"
    }
  ]
}
```

## API Request Format

### POST /api/items/verification

**Request:**
```json
{
  "foundItemId": "64f8b1234567890abcdef123",
  "ownerAnswers": [
    {
      "questionId": 0,
      "answer": "Black iPhone case",
      "videoKey": "default_video_placeholder"
    },
    {
      "questionId": 1,
      "answer": "Mountain wallpaper",
      "videoKey": "default_video_placeholder"
    },
    {
      "questionId": 2,
      "answer": "256GB storage",
      "videoKey": "default_video_placeholder"
    },
    {
      "questionId": 3,
      "answer": "Family photo with dog",
      "videoKey": "default_video_placeholder"
    },
    {
      "questionId": 4,
      "answer": "Banking app installed",
      "videoKey": "default_video_placeholder"
    }
  ]
}
```

**Response (201 Created):**
```json
{
  "_id": "64f8d9876543210fedcba098",
  "foundItemId": "64f8b1234567890abcdef123",
  "ownerId": "64f8c2345678901bcdef1234",
  "answers": [
    {
      "questionId": 0,
      "question": "What color is the phone case?",
      "founderAnswer": "It has a black case",
      "ownerAnswer": "Black iPhone case",
      "videoKey": "default_video_placeholder"
    }
    // ... 4 more entries
  ],
  "status": "pending",
  "similarityScore": null,
  "createdAt": "2025-12-02T10:30:00.000Z"
}
```

## Frontend Code Example

```typescript
// In AnswerQuestionsVideoScreen.tsx

const handleSubmit = async () => {
  // Build owner answers
  const ownerAnswers: OwnerAnswerInput[] = textAnswers.map((answer, index) => ({
    questionId: index,
    answer: answer.trim(),
    videoKey: 'default_video_placeholder',
  }));

  // Submit verification
  await itemsApi.submitVerification({
    foundItemId: foundItem._id,
    ownerAnswers,
  });
};
```

## Backend Processing Flow

1. **Receive Request**: Get `foundItemId` and `ownerAnswers[]`
2. **Fetch FoundItem**: Load questions and founder's answers
3. **Build Unified Answers**:
   ```typescript
   const answers = ownerAnswers.map((ownerAnswer) => ({
     questionId: ownerAnswer.questionId,
     question: foundItem.questions[ownerAnswer.questionId],
     founderAnswer: foundItem.founderAnswers[ownerAnswer.questionId],
     ownerAnswer: ownerAnswer.answer,
     videoKey: ownerAnswer.videoKey || 'default_video_placeholder',
   }));
   ```
4. **Save Verification**: Store unified structure in MongoDB
5. **Update Item Status**: Set found item to `pending_verification`

## Privacy & Security

- **Owner View**: `founderAnswer` field is **excluded** from response
- **Admin View**: All fields including `founderAnswer` are **visible**
- Backend automatically filters based on user role

## Testing

Run the test script:
```powershell
cd Backend
.\test-verification-flow.ps1
```

## Files Modified

### Backend
- ✅ `src/models/Verification.ts` - New unified schema
- ✅ `src/services/verificationService.ts` - Updated logic
- ✅ `src/controllers/itemController.ts` - Updated request handling

### Frontend
- ✅ `src/types/models.ts` - New TypeScript types
- ✅ `src/api/itemsApi.ts` - Updated API call
- ✅ `src/screens/owner/AnswerQuestionsVideoScreen.tsx` - Updated submission

## Future: Video Implementation

When adding real video recording:

```typescript
// 1. Record video
const videoUri = await recordVideo();

// 2. Upload to cloud storage
const videoUrl = await uploadVideo(videoUri);

// 3. Use in submission
const ownerAnswers = [{
  questionId: 0,
  answer: "Text description",
  videoKey: videoUrl  // ← Replace placeholder with real URL
}];
```

---

**Status**: ✅ Production Ready
**Version**: 1.0
**Date**: December 2, 2025
