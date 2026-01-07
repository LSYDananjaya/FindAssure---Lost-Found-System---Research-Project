# Quick Start Guide - Web Location Similarity

## What This System Does

This frontend webapp allows you to:
1. Input similarity data from AI matching (owner info + matched item IDs with scores)
2. Select 1-5 items from the matches
3. View full details of selected items from the database

## Installation & Running

### 1. Install Dependencies
```bash
cd WebLocationSimilarity
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

Access at: http://localhost:5174

### 3. Ensure Backend is Running
The backend must be running on http://localhost:5000 with the batch endpoint available.

## How to Use

### Page 1: Input Data
1. Enter Owner ID (e.g., "user123")
2. Enter Owner Location (e.g., "Colombo")
3. Add items:
   - Item ID: Found item ID from database (e.g., "674f1234abcd5678efgh9012")
   - Similarity Score: 0.00 to 1.00 (e.g., 0.85)
   - Location: Where item was found (e.g., "Library")
4. Click "Add Item" to add to list
5. Click "Next" when done

### Page 2: Select Items
1. Review items sorted by similarity score
2. Click on 1-5 items to select them
3. Selected items show a blue highlight and checkmark
4. Click "View Details"

### Page 3: Item Details
1. View full information for each selected item
2. See images, descriptions, contact info, etc.
3. Options:
   - "Back" - Go back to selection
   - "Start New Search" - Start over

## Example Data to Test

**Owner ID:** owner_001
**Owner Location:** Colombo, Sri Lanka

**Sample Items:**
1. Item ID: 674f1234abcd5678efgh9012
   Score: 0.95
   Location: University Library

2. Item ID: 674f5678abcd1234efgh3456
   Score: 0.87
   Location: Cafeteria

3. Item ID: 674f9012abcd5678efgh7890
   Score: 0.72
   Location: Sports Complex

## Backend Endpoint Required

**POST /api/items/found/batch**

Request:
```json
{
  "itemIds": ["674f1234...", "674f5678..."]
}
```

Response:
```json
[
  {
    "_id": "674f1234...",
    "itemName": "Black Laptop",
    "category": "Electronics",
    "description": "Dell laptop...",
    "location": "Library",
    "foundDate": "2024-12-01",
    "imageUrl": "https://...",
    "status": "available"
  }
]
```

## Troubleshooting

**"Backend connection error"**
- Check backend is running on port 5000
- Check CORS is enabled
- Verify endpoint exists

**"No items found"**
- Make sure item IDs exist in database
- Check backend console for errors

**Page won't load**
- Clear browser cache
- Check browser console for errors
- Restart dev server

## Tech Stack
- React 19
- TypeScript
- Vite 7
- Tailwind CSS 3
- React Router 6
- Axios

## File Structure
```
src/
├── pages/
│   ├── SimilarityInputPage.tsx    # Input form
│   ├── ItemSelectionPage.tsx      # Select items
│   └── ItemDetailsPage.tsx        # Show details
├── services/
│   └── itemService.ts             # API calls
├── types/
│   └── index.ts                   # TypeScript types
├── config/
│   └── api.ts                     # API config
└── App.tsx                        # Router setup
```

## Development Notes
- Data persists between pages using sessionStorage
- No authentication required (can be added)
- Supports up to 50 items in batch fetch
- Responsive design for mobile/desktop
