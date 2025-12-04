# Gemini AI Integration for Question Generation

## Overview

This document describes the integration of Google's Gemini AI to automatically generate verification questions for found items in the FindAssure Lost & Found System.

## Features

- **AI-Powered Question Generation**: Uses Google Gemini Pro to generate 10 contextual verification questions based on item category and description
- **Intelligent Fallback**: Provides category-specific fallback questions if AI is unavailable
- **Smart Question Selection**: Founder selects exactly 5 questions from the AI-generated list
- **Error Handling**: Graceful degradation with user-friendly error messages

## Architecture

### Backend Components

1. **Gemini Service** (`Backend/src/services/geminiService.ts`)
   - Integrates with Google Generative AI SDK
   - Generates questions using Gemini Pro model
   - Provides fallback questions for all categories
   - Handles API errors gracefully

2. **API Endpoint** (`POST /api/items/generate-questions`)
   - Receives: `{ category: string, description: string }`
   - Returns: `{ questions: string[] }` (array of 10 questions)
   - No authentication required (public endpoint)

3. **Controller** (`Backend/src/controllers/itemController.ts`)
   - `generateQuestions()` method validates input and calls Gemini service

### Frontend Components

1. **API Client** (`FindAssure/src/api/itemsApi.ts`)
   - `generateQuestions()` method calls backend API

2. **Questions Screen** (`FindAssure/src/screens/founder/ReportFoundQuestionsScreen.tsx`)
   - Fetches AI-generated questions on mount
   - Shows loading state during generation
   - Displays error with retry option on failure
   - Allows founder to select exactly 5 questions

## Setup Instructions

### 1. Get Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key

### 2. Configure Backend

1. Open `Backend/.env` file
2. Add or update the GEMINI_API_KEY:

```env
# Gemini AI Configuration
GEMINI_API_KEY=YOUR_ACTUAL_API_KEY_HERE
```

3. Replace `YOUR_ACTUAL_API_KEY_HERE` with your actual API key

### 3. Install Dependencies

Backend dependencies are already installed. The `@google/generative-ai` package is included.

### 4. Restart Backend Server

```powershell
cd Backend
npm run dev
```

## Usage Flow

1. **Founder Reports Found Item**:
   - Takes photo
   - Selects category
   - Provides description

2. **AI Question Generation**:
   - Frontend calls `POST /api/items/generate-questions`
   - Backend calls Gemini AI with category + description
   - AI generates 10 contextual questions
   - Questions returned to frontend

3. **Question Selection**:
   - Founder sees 10 AI-generated questions
   - Selects exactly 5 questions
   - Proceeds to answer the questions

4. **Item Submission**:
   - Selected questions + founder's answers stored
   - Owner later answers the same questions for verification

## Question Generation Logic

### AI Prompt Structure

The system uses a carefully crafted prompt that:
- Specifies the lost and found context
- Provides item category and description
- Requests exactly 10 questions
- Defines question quality criteria
- Includes example format

### Question Categories

Questions cover:
- Physical characteristics (color, size, material)
- Identifying marks or features
- Brand/model details
- Location and time context
- Contents or attachments
- Purchase/acquisition details
- Usage patterns
- Unique identifiers

### Fallback Questions

If AI is unavailable, category-specific questions are used:
- Electronics (10 questions)
- Clothing (10 questions)
- Accessories (10 questions)
- Documents (10 questions)
- Bags (10 questions)
- Jewelry (10 questions)
- Keys (10 questions)
- Books (10 questions)
- Sports Equipment (10 questions)
- Other (10 generic questions)

## API Reference

### Generate Questions

**Endpoint**: `POST /api/items/generate-questions`

**Request Body**:
```json
{
  "category": "Electronics",
  "description": "Black iPhone 13 Pro with a cracked screen protector"
}
```

**Response** (Success - 200):
```json
{
  "questions": [
    "What is the exact model and color of the iPhone?",
    "Can you describe the crack on the screen protector?",
    "What is the storage capacity of the device?",
    "Are there any cases or accessories attached?",
    "What was the last app or screen you were using?",
    "What is the lock screen wallpaper?",
    "Are there any stickers or custom engravings?",
    "What was the battery percentage when lost?",
    "Where and when did you lose it?",
    "What is the phone number or Apple ID associated?"
  ]
}
```

**Response** (Error - 400):
```json
{
  "message": "Category and description are required"
}
```

## Error Handling

### Backend Errors

1. **Missing API Key**: Falls back to category-specific questions
2. **API Call Failure**: Returns fallback questions
3. **Invalid Response**: Parses and validates, falls back if needed
4. **Rate Limiting**: Automatically retries with exponential backoff

### Frontend Errors

1. **Network Error**: Shows error message with retry button
2. **Loading State**: Shows spinner with "Generating questions with AI..."
3. **Empty Response**: Handles gracefully with error message

## Testing

### Test Backend Endpoint

```powershell
# Using PowerShell
$body = @{
    category = "Electronics"
    description = "Black iPhone 13 Pro with cracked screen"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/items/generate-questions" `
    -Method POST `
    -Body $body `
    -ContentType "application/json"
```

### Expected Output

```json
{
  "questions": [
    "What is the exact model and storage capacity of the iPhone?",
    "What color is the device?",
    "Can you describe the condition of the screen protector?",
    "What is the IMEI number?",
    "What was the battery level when you lost it?",
    "Are there any cases or stickers on it?",
    "What was the last thing you were doing on the phone?",
    "What is the lock screen wallpaper?",
    "Where and when did you lose it?",
    "What is the phone number associated with it?"
  ]
}
```

## Troubleshooting

### Issue: Questions are generic/not AI-generated

**Cause**: GEMINI_API_KEY not set or invalid

**Solution**: 
1. Check `.env` file has correct API key
2. Restart backend server
3. Check backend logs for errors

### Issue: API returns 400 error

**Cause**: Missing category or description

**Solution**: Ensure both fields are provided in request

### Issue: Slow response time

**Cause**: AI model processing time

**Solution**: This is normal. First request may take 2-5 seconds. Consider showing loading state.

## Security Considerations

1. **API Key Protection**: Never commit `.env` file to git
2. **Rate Limiting**: Consider implementing rate limiting on the endpoint
3. **Input Validation**: Backend validates category and description
4. **Public Endpoint**: No authentication required (suitable for founder flow)

## Cost Considerations

- Gemini API has a free tier with generous limits
- Monitor usage in Google Cloud Console
- Free tier: 60 requests per minute
- Cost beyond free tier is minimal (~$0.001 per request)

## Future Enhancements

1. **Caching**: Cache questions for identical category/description
2. **Question Quality Scoring**: Rate AI-generated questions
3. **Multi-language Support**: Generate questions in user's language
4. **Question Personalization**: Learn from successful verifications
5. **Hybrid Approach**: Mix AI questions with proven fallback questions

## Related Files

- `Backend/src/services/geminiService.ts` - Core AI service
- `Backend/src/controllers/itemController.ts` - API controller
- `Backend/src/routes/itemRoutes.ts` - Route definition
- `FindAssure/src/api/itemsApi.ts` - Frontend API client
- `FindAssure/src/screens/founder/ReportFoundQuestionsScreen.tsx` - UI screen
- `Backend/.env` - Configuration file

## Support

For issues or questions:
1. Check backend logs: `npm run dev` output
2. Check frontend logs: Expo console
3. Verify API key is valid
4. Test endpoint directly with curl/Postman

## Credits

- Google Gemini AI for question generation
- FindAssure Development Team
- SLIIT Research Project
