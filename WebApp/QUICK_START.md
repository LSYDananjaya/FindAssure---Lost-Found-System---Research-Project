# FindAssure Web Application - Quick Start Guide

## Project Overview

This web application provides a user-friendly interface for the FindAssure Lost & Found System. It consists of three main workflows:

### 1. **Adding Found Items (Founder Flow)**
Founders can report items they found through a 3-step process:
- **Step 1**: Enter item details (category, description, image URL, location)
- **Step 2**: AI generates 10 verification questions automatically
- **Step 3**: Founder answers the questions and provides contact info
- Item is saved to the database

### 2. **Viewing Found Items Dashboard**
- Browse all found items in the system
- Filter by category (Electronics, Clothing, etc.)
- Filter by status (Available, Pending Verification, Claimed)
- Click on any item to view details

### 3. **Claiming Items (Owner Flow)**
Owners can claim their lost items:
- View item details and verification questions
- Click "Claim This Item" button
- Answer the same questions the founder answered
- Submit verification for comparison

## Quick Setup

### 1. Install Dependencies
```bash
cd WebApp
npm install
```

### 2. Configure Backend URL
Create `.env` file:
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

### 3. Start Development Server
```bash
npm run dev
```
Opens at: `http://localhost:3000`

## Project Structure

```
WebApp/
├── src/
│   ├── components/
│   │   └── Layout.tsx          # Header, footer, navigation
│   ├── pages/
│   │   ├── Dashboard.tsx       # Found items list with filters
│   │   ├── AddItem.tsx         # 3-step form for adding items
│   │   └── ItemDetail.tsx      # Item details + claim verification
│   ├── services/
│   │   └── api.ts              # Backend API integration
│   └── App.tsx                 # Router configuration
└── package.json
```

## Key Features Implemented

### ✅ Multi-Step Form
- Progressive disclosure of information
- Visual progress indicator
- Validation at each step
- Back navigation support

### ✅ AI Integration
- Gemini AI generates verification questions
- Questions based on category and description
- 10 contextually relevant questions per item

### ✅ Dashboard
- Card-based layout
- Real-time filtering
- Status badges
- Responsive design

### ✅ Verification System
- Owner answers same questions as founder
- Answers stored separately
- Backend compares answers for verification

## API Endpoints Used

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/items/generate-questions` | Generate AI questions |
| POST | `/api/items/found` | Create found item |
| GET | `/api/items/found` | List all found items |
| GET | `/api/items/found/:id` | Get single item |
| POST | `/api/items/verification` | Submit verification |

## Component Breakdown

### Layout Component
- Persistent header with navigation
- "Add Found Item" button in nav
- Footer with project info
- Wraps all pages

### Dashboard Page
- Displays all found items as cards
- Category filter dropdown
- Status filter dropdown
- Item count display
- Click to view details

### AddItem Page
**Step 1: Basic Info**
- Category dropdown (10 categories)
- Description textarea
- Image URL input
- Location input
- "Generate Questions with AI" button

**Step 2: Answer Questions**
- Shows AI-generated questions
- Text area for each question
- Validation: all questions must be answered
- "Continue to Contact Info" button

**Step 3: Contact Info**
- Founder name input
- Email input
- Phone input
- Summary of entered info
- "Submit Found Item" button

### ItemDetail Page
- Large image display
- Item details (category, description, location, date)
- List of verification questions
- Founder contact information
- "Claim This Item" button (if available)
- Verification form (when claiming)

## Styling Approach

- **Modern gradient design**: Purple/blue gradient for primary actions
- **Card-based layout**: Clean, organized appearance
- **Responsive**: Works on desktop and mobile
- **Consistent spacing**: 8px grid system
- **Color scheme**:
  - Primary: `#667eea` to `#764ba2`
  - Background: `#f5f7fa`
  - Text: `#2d3748`
  - Secondary: `#718096`

## User Flow Examples

### Founder Adding Item
1. Navigate to "Add Found Item"
2. Select "Electronics" category
3. Describe: "Black iPhone 13 Pro with cracked screen protector"
4. Add image URL and location
5. Click "Generate Questions with AI"
6. Answer 10 questions about the phone
7. Enter contact details
8. Submit → Item appears in dashboard

### Owner Claiming Item
1. Browse dashboard
2. Find their iPhone
3. Click to view details
4. Review questions
5. Click "Claim This Item"
6. Answer all 10 questions
7. Submit → Verification created in backend

## Development Tips

### Adding New Categories
Edit the `CATEGORIES` array in both:
- `src/pages/Dashboard.tsx`
- `src/pages/AddItem.tsx`

### Changing API URL
Update `.env`:
```env
VITE_API_BASE_URL=http://your-backend-url/api
```

### Styling Changes
Each page has its own CSS file:
- `Dashboard.css`
- `AddItem.css`
- `ItemDetail.css`
- `Layout.css`

## Testing Checklist

- [ ] Can add new found item
- [ ] AI generates questions successfully
- [ ] All form validations work
- [ ] Dashboard loads items
- [ ] Filters work correctly
- [ ] Item details page loads
- [ ] Can submit verification
- [ ] Contact info displays
- [ ] Navigation works
- [ ] Responsive on mobile

## Common Issues

### "Backend not connected"
- Check if backend is running on port 5000
- Verify `.env` file exists with correct URL
- Check browser console for CORS errors

### "Questions not generating"
- Backend needs `GEMINI_API_KEY` configured
- Check backend logs for errors
- Falls back to category-specific questions if AI fails

### TypeScript Errors
- Run `npm install` to ensure all types are installed
- Check `tsconfig.json` for proper configuration

## Production Build

```bash
# Build
npm run build

# Preview
npm run preview
```

Output in `dist/` folder ready for deployment.

## Integration with Existing System

This WebApp integrates with:
- **Backend**: Same API as mobile app uses
- **Database**: MongoDB (same collections)
- **AI Service**: Gemini AI for questions

All three interfaces (Web, Mobile, Backend) share the same:
- Data models
- API endpoints
- Verification logic
- Question generation system

## Next Steps

Potential enhancements:
- [ ] Image upload functionality
- [ ] User authentication
- [ ] Search functionality
- [ ] Advanced filtering
- [ ] Notifications
- [ ] Admin dashboard
- [ ] Analytics

---

**Note**: This web interface provides the same functionality as the mobile app but optimized for desktop browsers. Both use the same backend API and database.
