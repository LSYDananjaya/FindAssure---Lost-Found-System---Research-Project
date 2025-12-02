# Verification Unified Structure Implementation

## Overview
The verification system now uses a **unified array structure** where each answer contains all related information (question ID, question text, founder answer, owner answer, and video key) in a single object within an array.

## Backend Changes

### 1. Model Structure (`Backend/src/models/Verification.ts`)

**New Interface:**
```typescript
export interface IVerificationAnswer {
  questionId: number;        // Index of the question (0-4)
  question: string;          // The question text
  founderAnswer: string;     // Founder's text answer
  ownerAnswer: string;       // Owner's text/video answer
  videoKey: string;          // Video storage key (default: 'default_video_placeholder')
}

export interface IVerification extends Document {
  foundItemId: Types.ObjectId;
  ownerId: Types.ObjectId;
  answers: IVerificationAnswer[];  // Unified array structure
  status: VerificationStatus;
  similarityScore: number | null;
  createdAt: Date;
  updatedAt: Date;
}
```

**What Changed:**
- ❌ Removed: `questions: string[]`
- ❌ Removed: `founderAnswers: string[]`
- ❌ Removed: `ownerVideoAnswers: IOwnerVideoAnswer[]`
- ✅ Added: `answers: IVerificationAnswer[]` - Single unified array

### 2. Service Layer (`Backend/src/services/verificationService.ts`)

**New Input Interface:**
```typescript
export interface OwnerAnswerInput {
  questionId: number;
  answer: string;
  videoKey?: string;  // Optional, defaults to 'default_video_placeholder'
}

export interface CreateVerificationData {
  foundItemId: string;
  ownerId: string;
  ownerAnswers: OwnerAnswerInput[];
}
```

**Logic Flow:**
1. Fetch the `FoundItem` to get questions and founder's answers
2. Map owner's answers to create unified answer objects
3. Each answer object contains:
   - `questionId`: Index from the questions array
   - `question`: Pulled from `foundItem.questions[questionId]`
   - `founderAnswer`: Pulled from `foundItem.founderAnswers[questionId]`
   - `ownerAnswer`: From owner input
   - `videoKey`: From owner input or default placeholder

**Privacy Protection:**
- Owner view: `founderAnswer` is excluded from response
- Admin view: All fields including `founderAnswer` are visible

### 3. Controller (`Backend/src/controllers/itemController.ts`)

**Updated Request Body:**
```javascript
POST /api/items/verification
{
  "foundItemId": "64f8b...",
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
    }
    // ... for all 5 questions
  ]
}
```

## Frontend Changes

### 1. Type Definitions (`FindAssure/src/types/models.ts`)

**New Types:**
```typescript
export interface VerificationAnswer {
  questionId: number;
  question: string;
  founderAnswer?: string;  // Only visible to admin
  ownerAnswer: string;
  videoKey: string;
}

export interface OwnerAnswerInput {
  questionId: number;
  answer: string;
  videoKey?: string;
}

export interface VerificationRequest {
  _id: string;
  foundItemId: string;
  ownerId: string;
  answers: VerificationAnswer[];  // Unified structure
  status: 'pending' | 'passed' | 'failed';
  similarityScore?: number | null;
  createdAt: string;
  updatedAt?: string;
}
```

### 2. API Client (`FindAssure/src/api/itemsApi.ts`)

**Updated Method:**
```typescript
submitVerification: async (data: {
  foundItemId: string;
  ownerAnswers: OwnerAnswerInput[];
}): Promise<any> => {
  const response = await axiosClient.post('/items/verification', data);
  return response.data;
}
```

### 3. Owner Screen (`FindAssure/src/screens/owner/AnswerQuestionsVideoScreen.tsx`)

**Updated Submission Logic:**
```typescript
const handleSubmit = async () => {
  // Build unified owner answers array
  const ownerAnswers: OwnerAnswerInput[] = textAnswers.map((answer, index) => ({
    questionId: index,
    answer: answer.trim(),
    videoKey: 'default_video_placeholder',
  }));

  await itemsApi.submitVerification({
    foundItemId: foundItem._id,
    ownerAnswers,
  });
};
```

## Database Document Example

**Before (Old Structure):**
```json
{
  "foundItemId": "64f8b...",
  "ownerId": "64f8c...",
  "questions": ["Q1", "Q2", "Q3", "Q4", "Q5"],
  "founderAnswers": ["FA1", "FA2", "FA3", "FA4", "FA5"],
  "ownerVideoAnswers": [
    {"question": "Q1", "videoUrl": "OA1"},
    {"question": "Q2", "videoUrl": "OA2"}
  ],
  "status": "pending"
}
```

**After (New Structure):**
```json
{
  "foundItemId": "64f8b...",
  "ownerId": "64f8c...",
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
    // ... 3 more entries
  ],
  "status": "pending"
}
```

## Benefits of Unified Structure

1. **Atomic Data**: Each answer is self-contained with all related information
2. **Easier to Process**: No need to match indices across separate arrays
3. **Scalable**: Easy to add more fields (e.g., timestamps, confidence scores)
4. **Type Safe**: Better TypeScript type checking
5. **Future Ready**: Prepared for video implementation with `videoKey` field

## Future Video Implementation

When implementing actual video recording:

1. **Frontend**: Record video using Expo Camera/AV
2. **Upload**: Send video to cloud storage (e.g., Cloudinary, AWS S3)
3. **Update**: Replace `videoKey: 'default_video_placeholder'` with actual video URL/key
4. **Backend**: Store the video reference in the same unified structure

**Example with Real Video:**
```typescript
const ownerAnswers: OwnerAnswerInput[] = textAnswers.map((answer, index) => ({
  questionId: index,
  answer: answer.trim(),
  videoKey: videoUrls[index], // Actual video URL from cloud storage
}));
```

## Testing the Flow

1. **Owner answers questions** → Frontend sends `ownerAnswers` array
2. **Backend receives request** → Validates and fetches `FoundItem`
3. **Backend creates verification** → Builds unified `answers` array
4. **Backend saves to DB** → MongoDB stores the unified structure
5. **Admin views verification** → Can see both founder and owner answers
6. **Owner views verification** → Only sees own answers (founder's hidden)

## Migration Notes

If you have existing verification documents in the old format, you'll need to:
1. Create a migration script to transform old documents
2. Map old fields to new unified structure
3. Set default values for `videoKey` field

---

**Status**: ✅ Fully implemented and working
**Last Updated**: December 2, 2025
