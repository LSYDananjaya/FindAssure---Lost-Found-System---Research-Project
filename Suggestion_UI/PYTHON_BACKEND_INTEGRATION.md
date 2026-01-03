# Location-Based Item Suggestion System Integration

## Overview

This document explains how the Suggestion_UI web interface integrates with the Python backend for location-based item matching.

## System Architecture

```
User Input (Suggestion_UI) 
    ↓
Python Backend API (http://127.0.0.1:5000/api/find-items)
    ↓
Location Matching Algorithm
    ↓
Matched Items Display (Item Dashboard)
```

## Prerequisites

1. **Python Backend**: Must be running on `http://127.0.0.1:5000`
   - Navigate to `Sugestion_python/` directory
   - Run: `python app.py`

2. **Suggestion_UI**: React web interface
   - Navigate to `Suggestion_UI/` directory
   - Run: `npm install` (first time only)
   - Run: `npm run dev`

## How It Works

### Step 1: Data Collection (SimilarityInputPage)

Users enter the following information:

**Owner Information:**
- Owner ID (number)
- Category Name (e.g., "laptop")
- Description Match Confidence (0-100)
- Owner Location (selected from location picker)
- Owner Location Confidence Stage (1-3)

**Found Items:**
- Item ID (number)
- Description Score (0-100)
- Item Location (selected from location picker)
- Floor ID (optional, auto-filled if new_building)
- Hall Name (optional, auto-filled if specific hall selected)

### Step 2: API Call to Python Backend

When the user clicks "Find Matches", the system:

1. Transforms the UI data into Python backend format:
```json
{
  "owner_id": 104,
  "categary_name": "laptop",
  "categary_data": [
    {
      "id": 16,
      "description_scrore": 93,
      "found_location": [
        {
          "location": "new_building",
          "floor_id": 2,
          "hall_name": "F302"
        }
      ]
    }
    // ... more items
  ],
  "description_match_cofidence": 90,
  "owner_location": "new_building",
  "floor_id": null,
  "hall_name": null,
  "owner_location_confidence_stage": 2
}
```

2. Sends POST request to `http://127.0.0.1:5000/api/find-items`

3. Receives response:
```json
{
  "location_match": true,
  "matched_item_ids": [16, 17, 18, 19, 20, 6, 99],
  "matched_locations": ["engineering_faculty", "new_building", "new_building_entrance"],
  "success": true
}
```

### Step 3: Display Matched Items (ItemSelectionPage)

The system:
- Filters the original item list to show only matched items
- Displays location match status
- Shows number of matches found
- Allows selection of 1-5 items for further verification

### Step 4: View Item Details (ItemDetailsPage)

Selected items are displayed with full details fetched from the backend.

## File Structure

```
Suggestion_UI/
├── src/
│   ├── pages/
│   │   ├── SimilarityInputPage.tsx    # Step 1: Data collection
│   │   ├── ItemSelectionPage.tsx      # Step 3: Display matches
│   │   └── ItemDetailsPage.tsx        # Step 4: Item details
│   ├── services/
│   │   ├── locationMatchService.ts    # Python backend API calls
│   │   └── itemService.ts             # Item data fetching
│   ├── types/
│   │   └── index.ts                   # TypeScript type definitions
│   └── components/
│       └── LocationSelector.tsx       # Location picker component
```

## Key Features

### 1. Smart Location Handling
- Supports campus-wide locations
- Handles building-specific locations (floors, halls)
- Automatically extracts floor_id and hall_name for new_building

### 2. Data Transformation
- Converts similarity scores from 0-1 (UI) to 0-100 (backend)
- Properly formats nested location data
- Handles null values for optional fields

### 3. Error Handling
- Connection errors to Python backend
- Validation errors for missing data
- User-friendly error messages

### 4. Visual Feedback
- Loading states during API calls
- Success/error indicators
- Match confidence display
- Location match status badges

## Usage Example

### Example Data Entry:

**Owner Information:**
- Owner ID: `104`
- Category: `laptop`
- Description Confidence: `90`
- Location: `new_building` (Floor 2)
- Confidence Stage: `2 - Medium Confidence`

**Add Items:**
1. Item ID: `16`, Score: `93`, Location: `new_building` → Floor 2 → F302
2. Item ID: `17`, Score: `88`, Location: `new_building` → Floor 1 → passage_1
3. Item ID: `6`, Score: `95`, Location: `engineering_faculty`

**Click "Find Matches"**
- System calls Python backend
- Receives matched_item_ids: [16, 17, 6]
- Navigates to ItemSelectionPage showing only these 3 matched items

## Testing

### Test with Sample Data:

1. Start Python backend:
```bash
cd Sugestion_python
python app.py
```

2. Start Suggestion_UI:
```bash
cd Suggestion_UI
npm run dev
```

3. Open browser to `http://localhost:5173`

4. Enter the test data provided above

5. Verify:
   - API request is sent to Python backend
   - Response is received
   - Only matched items are displayed
   - Selection and navigation work correctly

## Troubleshooting

### Python Backend Not Responding
**Error:** "Failed to connect to location matching service"
**Solution:** 
- Ensure Python backend is running on port 5000
- Check `http://127.0.0.1:5000` in browser
- Verify no firewall blocking

### No Matched Items
**Issue:** Location match returns empty array
**Check:**
- Owner location matches found item locations
- Description scores are reasonable
- Location confidence stage is appropriate

### CORS Errors
**Solution:** 
- Python backend should have CORS enabled
- Add to Flask app:
```python
from flask_cors import CORS
CORS(app)
```

## API Endpoints

### Python Backend

**POST** `/api/find-items`
- **Purpose:** Find items matching location criteria
- **Request:** PythonBackendRequest (see types/index.ts)
- **Response:** PythonBackendResponse with matched_item_ids
- **Timeout:** 30 seconds

## Configuration

### Update API URL

To change the Python backend URL, edit:
```typescript
// src/services/locationMatchService.ts
const PYTHON_API_URL = 'http://127.0.0.1:5000/api/find-items';
```

## Next Steps

1. **Deploy Python Backend:** Host on server for production use
2. **Update API URLs:** Point to production endpoints
3. **Add Authentication:** Secure API calls
4. **Enhance Error Handling:** More detailed error messages
5. **Add Analytics:** Track match success rates

## Support

For issues or questions:
- Check console logs in browser (F12)
- Check Python backend logs
- Verify data format matches expected structure
- Ensure all required fields are filled
