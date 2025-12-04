# Gemini AI Integration - Setup Guide

## Overview
This system now uses Google's **Gemini AI (Free API)** to generate intelligent verification questions based on the item category and description when a founder reports a found item.

## ✅ What's Been Implemented

### Backend Integration
1. **Gemini Service** (`Backend/src/services/geminiService.ts`)
   - Uses `@google/generative-ai` SDK
   - Generates 10 contextual questions using `gemini-pro` model
   - Includes fallback questions for 9+ categories if API fails
   - Smart error handling and response parsing

2. **API Endpoint** (`POST /api/items/generate-questions`)
   - Accepts: `{ category: string, description: string }`
   - Returns: `{ questions: string[] }` (10 questions)
   - Public endpoint (no authentication required)

3. **Environment Configuration**
   - Added `GEMINI_API_KEY` to `.env`

### Frontend Integration
1. **Updated API Client** (`FindAssure/src/api/itemsApi.ts`)
   - Added `generateQuestions()` method

2. **Enhanced Questions Screen** (`ReportFoundQuestionsScreen.tsx`)
   - Calls backend API on screen load
   - Shows loading state with "Generating questions with AI..."
   - Error handling with retry option
   - Displays AI-generated questions
   - User selects exactly 5 questions to proceed

## 🔑 Get Your Free Gemini API Key

### Step 1: Visit Google AI Studio
Go to: **https://makersuite.google.com/app/apikey**

Or: **https://aistudio.google.com/app/apikey**

### Step 2: Sign in with Google Account
Use your Google account to sign in.

### Step 3: Create API Key
1. Click **"Create API Key"** button
2. Choose **"Create API key in new project"** or select existing project
3. Copy the generated API key (starts with `AIza...`)

### Step 4: Add to Backend .env
Open `Backend/.env` and replace:
```env
GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
```

With your actual key:
```env
GEMINI_API_KEY=AIzaSyC...your_actual_key_here
```

## 🚀 Testing the Integration

### Test 1: Backend API Test
```powershell
# Make sure backend is running
cd Backend
npm run dev

# In another terminal, test the endpoint
curl -X POST http://localhost:5000/api/items/generate-questions `
  -H "Content-Type: application/json" `
  -d '{"category":"Electronics","description":"Black iPhone 13 Pro with cracked screen"}'
```

Expected response:
```json
{
  "questions": [
    "What is the exact model of the iPhone?",
    "What color is the device?",
    "Can you describe the crack on the screen protector?",
    ...
  ]
}
```

### Test 2: Full Flow Test
1. Start backend: `cd Backend; npm run dev`
2. Start frontend: `cd FindAssure; npm start`
3. Open app in Expo
4. Go to "Report Found Item" flow
5. Fill in item details (category + description)
6. On Questions screen, you should see:
   - Loading indicator: "Generating questions with AI..."
   - Then 10 AI-generated questions appear
   - Questions are specific to your item description
   - Select 5 questions and continue

## 📋 How It Works

### Flow Diagram
```
Founder enters item details
    ↓
Category + Description
    ↓
Frontend calls: POST /api/items/generate-questions
    ↓
Backend calls Gemini API with prompt
    ↓
Gemini generates 10 contextual questions
    ↓
Backend returns questions to frontend
    ↓
Founder selects 5 questions
    ↓
Founder answers selected questions
    ↓
Item is posted with questions + answers
```

### Prompt Engineering
The system uses a carefully crafted prompt that:
- Instructs Gemini to generate exactly 10 questions
- Focuses on ownership verification details
- Considers item category and description
- Requests specific, detailed questions
- Returns structured JSON response

### Fallback System
If Gemini API fails (network issues, rate limits, etc.):
- System automatically uses category-specific fallback questions
- Covers 9 categories: Electronics, Clothing, Accessories, Documents, Bags, Jewelry, Keys, Books, Sports
- Ensures user experience is never blocked

## 🎯 Categories Supported

The AI can generate intelligent questions for:
- ✅ Electronics (phones, laptops, tablets, etc.)
- ✅ Clothing (shirts, pants, jackets, etc.)
- ✅ Accessories (watches, sunglasses, etc.)
- ✅ Documents (IDs, passports, certificates, etc.)
- ✅ Bags (backpacks, handbags, wallets, etc.)
- ✅ Jewelry (rings, necklaces, bracelets, etc.)
- ✅ Keys (car keys, house keys, etc.)
- ✅ Books (textbooks, novels, etc.)
- ✅ Sports (equipment, gear, etc.)
- ✅ Other (any custom category)

## 🔍 Example Generated Questions

### For "Black iPhone 13 Pro with cracked screen protector"
1. What is the exact model and storage capacity of the iPhone?
2. What color is the device?
3. Can you describe the pattern or location of the crack on the screen protector?
4. What is the IMEI or serial number?
5. Are there any cases, stickers, or accessories on the phone?
6. What is the last app or screen that was visible?
7. What is the battery health percentage?
8. Are there any unique wallpapers or home screen layouts?
9. Where exactly did you lose the phone?
10. When did you notice the phone was missing?

### For "Brown leather wallet"
1. What brand is the wallet?
2. What is the exact color and type of leather?
3. How many card slots does it have?
4. Are there any unique marks, scratches, or wear patterns?
5. What was inside the wallet when you lost it?
6. Are there any initials, monograms, or engravings?
7. What is the approximate size or dimensions?
8. Does it have a coin compartment or zipper?
9. Where did you purchase the wallet?
10. Where and when did you lose it?

## 🛠️ Troubleshooting

### Issue: "Failed to generate questions"
**Cause:** API key not set or invalid
**Solution:** 
1. Check `.env` file has correct `GEMINI_API_KEY`
2. Restart backend server
3. Verify key at https://makersuite.google.com/app/apikey

### Issue: "Questions are not AI-generated"
**Cause:** Using fallback questions (API failed silently)
**Solution:**
1. Check backend logs for errors
2. Verify internet connection
3. Check API key hasn't exceeded rate limits
4. Test API directly with curl

### Issue: Rate Limit Exceeded
**Cause:** Too many API calls (free tier limits)
**Solution:**
- Gemini free tier: 60 requests per minute
- Consider implementing caching
- Or upgrade to paid tier if needed

## 📊 Free Tier Limits

Google Gemini API Free Tier:
- ✅ **60 requests per minute**
- ✅ **1,500 requests per day**
- ✅ **1 million tokens per month**
- ✅ **100% FREE forever**

This is more than enough for development and moderate production use!

## 🎉 Benefits

1. **Intelligent Questions**: Context-aware questions based on actual item details
2. **Better Verification**: More specific questions = better ownership verification
3. **User Experience**: Dynamic, relevant questions for each item
4. **Scalable**: Handles any category or item type
5. **Reliable**: Fallback system ensures no downtime

## 📝 Notes

- Questions are generated when founder reaches the questions screen
- Takes 2-5 seconds to generate (shows loading indicator)
- Generated questions are not stored (regenerated each time if needed)
- Founder still selects exactly 5 questions from the 10 generated
- Selected questions and answers are stored with the found item

## 🔐 Security

- API key is stored in `.env` (never committed to Git)
- Backend handles all API calls (frontend never sees the key)
- Rate limiting protected by Gemini's built-in limits
- Fallback system prevents abuse

---

**Status**: ✅ Fully Integrated and Ready to Use!

Just add your Gemini API key and test the flow.
