# Complete Verification Flow Example

## Scenario
A founder found an iPhone and reported it. An owner believes it's theirs and wants to verify ownership.

---

## Step 1: Founder Reports Found Item

**Frontend Request:**
```typescript
// In ReportFoundContactScreen.tsx
const foundItem = await itemsApi.reportFoundItem({
  imageUrl: 'https://cloudinary.com/iphone123.jpg',
  category: 'Electronics',
  description: 'iPhone 13 Pro found at Central Park',
  questions: [
    'What color is the phone case?',
    'What is the lock screen wallpaper?',
    'How much storage does the phone have?',
    'What is the most recent photo in the gallery?',
    'What banking app is installed?'
  ],
  founderAnswers: [
    'Black leather case',
    'Mountain landscape photo',
    '256GB',
    'Picture of a golden retriever',
    'Chase Mobile app'
  ],
  location: 'Central Park, near the fountain',
  founderContact: {
    name: 'John Smith',
    email: 'john@example.com',
    phone: '+1234567890'
  }
});
```

**Backend Stores:**
```json
// FoundItem Document in MongoDB
{
  "_id": "64f8b1234567890abcdef123",
  "imageUrl": "https://cloudinary.com/iphone123.jpg",
  "category": "Electronics",
  "description": "iPhone 13 Pro found at Central Park",
  "questions": [
    "What color is the phone case?",
    "What is the lock screen wallpaper?",
    "How much storage does the phone have?",
    "What is the most recent photo in the gallery?",
    "What banking app is installed?"
  ],
  "founderAnswers": [
    "Black leather case",
    "Mountain landscape photo",
    "256GB",
    "Picture of a golden retriever",
    "Chase Mobile app"
  ],
  "location": "Central Park, near the fountain",
  "founderContact": {
    "name": "John Smith",
    "email": "john@example.com",
    "phone": "+1234567890"
  },
  "status": "available",
  "createdAt": "2025-12-02T08:00:00.000Z"
}
```

---

## Step 2: Owner Browses Found Items

**Frontend Request:**
```typescript
// In FindLostResultsScreen.tsx
const foundItems = await itemsApi.getFoundItems();
```

**Backend Response (Owner View):**
```json
[
  {
    "_id": "64f8b1234567890abcdef123",
    "imageUrl": "https://cloudinary.com/iphone123.jpg",
    "category": "Electronics",
    "description": "iPhone 13 Pro found at Central Park",
    "questions": [
      "What color is the phone case?",
      "What is the lock screen wallpaper?",
      "How much storage does the phone have?",
      "What is the most recent photo in the gallery?",
      "What banking app is installed?"
    ],
    "location": "Central Park, near the fountain",
    "status": "available",
    "createdAt": "2025-12-02T08:00:00.000Z"
    // NOTE: founderAnswers and founderContact are HIDDEN from owner
  }
]
```

---

## Step 3: Owner Views Item Details

**Frontend Navigation:**
```typescript
// In ItemDetailScreen.tsx
navigation.navigate('ItemDetail', { foundItem });
```

**Display to Owner:**
- ✅ Image, category, description, location
- ✅ List of questions (5 questions)
- ❌ NO founder's answers shown
- ❌ NO founder's contact shown (not yet verified)

---

## Step 4: Owner Answers Questions

**Frontend Screen:**
```typescript
// In AnswerQuestionsVideoScreen.tsx
const [textAnswers, setTextAnswers] = useState([
  '', '', '', '', ''
]);

// Owner fills in:
textAnswers[0] = "Black case";
textAnswers[1] = "Mountain wallpaper";
textAnswers[2] = "256GB storage";
textAnswers[3] = "Photo of my golden retriever";
textAnswers[4] = "Chase banking app";
```

**Frontend Submission:**
```typescript
const handleSubmit = async () => {
  // Build unified owner answers
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

**HTTP Request:**
```http
POST /api/items/verification
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "foundItemId": "64f8b1234567890abcdef123",
  "ownerAnswers": [
    {
      "questionId": 0,
      "answer": "Black case",
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
      "answer": "Photo of my golden retriever",
      "videoKey": "default_video_placeholder"
    },
    {
      "questionId": 4,
      "answer": "Chase banking app",
      "videoKey": "default_video_placeholder"
    }
  ]
}
```

---

## Step 5: Backend Processes Verification

**Backend Service Logic:**
```typescript
// In verificationService.ts

// 1. Fetch the found item
const foundItem = await FoundItem.findById(data.foundItemId);

// 2. Build unified answers array
const answers = data.ownerAnswers.map((ownerAnswer) => {
  const idx = ownerAnswer.questionId;
  
  return {
    questionId: idx,
    question: foundItem.questions[idx],           // "What color is the phone case?"
    founderAnswer: foundItem.founderAnswers[idx], // "Black leather case"
    ownerAnswer: ownerAnswer.answer,               // "Black case"
    videoKey: ownerAnswer.videoKey || 'default_video_placeholder',
  };
});

// 3. Create verification document
const verification = await Verification.create({
  foundItemId: new Types.ObjectId(data.foundItemId),
  ownerId: new Types.ObjectId(data.ownerId),
  answers,
  status: 'pending',
  similarityScore: null,
});

// 4. Update found item status
await FoundItem.findByIdAndUpdate(data.foundItemId, {
  status: 'pending_verification',
});
```

**Verification Document Created:**
```json
{
  "_id": "64f8d9876543210fedcba098",
  "foundItemId": "64f8b1234567890abcdef123",
  "ownerId": "64f8c2345678901bcdef1234",
  "answers": [
    {
      "questionId": 0,
      "question": "What color is the phone case?",
      "founderAnswer": "Black leather case",
      "ownerAnswer": "Black case",
      "videoKey": "default_video_placeholder"
    },
    {
      "questionId": 1,
      "question": "What is the lock screen wallpaper?",
      "founderAnswer": "Mountain landscape photo",
      "ownerAnswer": "Mountain wallpaper",
      "videoKey": "default_video_placeholder"
    },
    {
      "questionId": 2,
      "question": "How much storage does the phone have?",
      "founderAnswer": "256GB",
      "ownerAnswer": "256GB storage",
      "videoKey": "default_video_placeholder"
    },
    {
      "questionId": 3,
      "question": "What is the most recent photo in the gallery?",
      "founderAnswer": "Picture of a golden retriever",
      "ownerAnswer": "Photo of my golden retriever",
      "videoKey": "default_video_placeholder"
    },
    {
      "questionId": 4,
      "question": "What banking app is installed?",
      "founderAnswer": "Chase Mobile app",
      "ownerAnswer": "Chase banking app",
      "videoKey": "default_video_placeholder"
    }
  ],
  "status": "pending",
  "similarityScore": null,
  "createdAt": "2025-12-02T10:30:00.000Z"
}
```

---

## Step 6: Admin Reviews Verification

**Admin Frontend Request:**
```typescript
// In AdminDashboardScreen.tsx
const verifications = await adminApi.getAllVerifications();
```

**Backend Response (Admin View):**
```json
{
  "_id": "64f8d9876543210fedcba098",
  "foundItemId": {
    "_id": "64f8b1234567890abcdef123",
    "category": "Electronics",
    "description": "iPhone 13 Pro found at Central Park",
    "imageUrl": "https://cloudinary.com/iphone123.jpg",
    "location": "Central Park, near the fountain"
  },
  "ownerId": {
    "_id": "64f8c2345678901bcdef1234",
    "name": "Sarah Johnson",
    "email": "sarah@example.com",
    "phone": "+1987654321"
  },
  "answers": [
    {
      "questionId": 0,
      "question": "What color is the phone case?",
      "founderAnswer": "Black leather case",    // ✅ Admin can see this
      "ownerAnswer": "Black case",
      "videoKey": "default_video_placeholder"
    }
    // ... all 5 answers with BOTH founder and owner responses
  ],
  "status": "pending",
  "similarityScore": null,
  "createdAt": "2025-12-02T10:30:00.000Z"
}
```

**Admin Compares Answers:**
| Question | Founder Answer | Owner Answer | Match? |
|----------|----------------|--------------|--------|
| Case color | Black leather case | Black case | ✅ |
| Wallpaper | Mountain landscape photo | Mountain wallpaper | ✅ |
| Storage | 256GB | 256GB storage | ✅ |
| Recent photo | Picture of a golden retriever | Photo of my golden retriever | ✅ |
| Banking app | Chase Mobile app | Chase banking app | ✅ |

---

## Step 7: Admin Approves Verification

**Admin Request:**
```http
PUT /api/admin/verifications/64f8d9876543210fedcba098/evaluate
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "status": "passed",
  "similarityScore": 0.95
}
```

**Backend Updates:**
1. ✅ Verification status → `passed`
2. ✅ Similarity score → `0.95`
3. ✅ FoundItem status → `claimed`

---

## Step 8: Owner Gets Founder's Contact

**Owner Views Verification:**
```typescript
const verification = await itemsApi.getVerificationById(id);
```

**Response (Owner View with Founder Contact):**
```json
{
  "_id": "64f8d9876543210fedcba098",
  "foundItemId": {
    "_id": "64f8b1234567890abcdef123",
    "category": "Electronics",
    "description": "iPhone 13 Pro found at Central Park",
    "founderContact": {
      "name": "John Smith",
      "email": "john@example.com",
      "phone": "+1234567890"
    }
  },
  "answers": [
    {
      "questionId": 0,
      "question": "What color is the phone case?",
      "ownerAnswer": "Black case",
      "videoKey": "default_video_placeholder"
      // NOTE: founderAnswer is EXCLUDED for owner
    }
  ],
  "status": "passed",
  "similarityScore": 0.95
}
```

**Owner Can Now:**
- ✅ See founder's contact information
- ✅ Call/email to arrange pickup
- ✅ Retrieve their lost iPhone

---

## Key Benefits of Unified Structure

### 1. Atomic Data
Each answer is self-contained with all related information:
```json
{
  "questionId": 0,
  "question": "What color is the phone case?",
  "founderAnswer": "Black leather case",
  "ownerAnswer": "Black case",
  "videoKey": "default_video_placeholder"
}
```

### 2. Easy Comparison
Admin can easily compare founder vs owner answers side-by-side in the same object.

### 3. Future-Ready
Video implementation only requires updating `videoKey`:
```json
{
  "questionId": 0,
  "answer": "Black case",
  "videoKey": "https://cloudinary.com/videos/answer-0.mp4"  // Real video URL
}
```

### 4. Type Safety
Frontend and backend share the same structure:
```typescript
interface VerificationAnswer {
  questionId: number;
  question: string;
  founderAnswer?: string;  // Hidden from owner
  ownerAnswer: string;
  videoKey: string;
}
```

---

## Summary

✅ **Owner submits answers** → Frontend sends `ownerAnswers` array  
✅ **Backend processes** → Builds unified `answers` array with both sets  
✅ **Verification saved** → All data in one clean structure  
✅ **Admin reviews** → Sees complete comparison in single array  
✅ **Owner protected** → Founder's answers hidden until verified  

**Status**: Production Ready 🚀
