# 🚀 Quick Start Guide - Location-Based Item Suggestion System

## ⚡ Start Everything in 3 Steps

### Step 1: Start Python Backend
```powershell
cd Sugestion_python
python app.py
```
✅ Backend should be running at `http://127.0.0.1:5000`

### Step 2: Start Suggestion UI
```powershell
cd Suggestion_UI
npm run dev
```
✅ UI should open at `http://localhost:5173`

### Step 3: Test the System
1. Open browser to `http://localhost:5173`
2. Fill in the form (see example below)
3. Click "Find Matches"
4. View matched items

---

## 📝 Example Test Data

### Owner Information
| Field | Value |
|-------|-------|
| Owner ID | `104` |
| Category | `laptop` |
| Description Confidence | `90` |
| Owner Location | `new_building` |
| Confidence Stage | `2 - Medium` |

### Add These Items

**Item 1:**
- ID: `16`
- Score: `93`
- Location: `new_building` → Floor `2` → Hall `F302`

**Item 2:**
- ID: `17`
- Score: `88`
- Location: `new_building` → Floor `1` → Hall `passage_1`

**Item 3:**
- ID: `6`
- Score: `95`
- Location: `engineering_faculty`

**Item 4:**
- ID: `99`
- Score: `95`
- Location: `new_building_entrance`

---

## 🎯 What Should Happen

1. ✅ Click "Find Matches" button
2. ✅ Loading spinner appears
3. ✅ API call to Python backend (check console)
4. ✅ Navigate to "Matched Items" page
5. ✅ See only items that match location criteria
6. ✅ Green banner shows "X matching items found"
7. ✅ Select 1-5 items
8. ✅ Click "View Details" to see full information

---

## 🐛 Quick Troubleshooting

### ❌ "Failed to connect to location matching service"
**Fix:** Make sure Python backend is running
```powershell
cd Sugestion_python
python app.py
```

### ❌ "No matching items found"
**Fix:** Check that:
- Items exist in your backend database
- Location names match exactly
- Scores are reasonable (50-100)

### ❌ CORS Error in Browser Console
**Fix:** Add CORS to Python backend:
```python
from flask_cors import CORS
CORS(app)
```

### ❌ Page shows loading forever
**Fix:** 
1. Check Python backend terminal for errors
2. Open browser console (F12) for error details
3. Verify backend URL is `http://127.0.0.1:5000`

---

## 🔍 Verify It's Working

### Check Browser Console (F12)
You should see:
```
Sending request to Python backend: {...}
Python backend response: {...}
```

### Check Python Backend Terminal
You should see:
```
POST /api/find-items
Status: 200
```

### Check UI
You should see:
- ✅ Match success banner (green or yellow)
- ✅ Number of matched items
- ✅ Only matched items displayed
- ✅ Can select and view details

---

## 📊 API Request Example

When you click "Find Matches", this is sent:
```json
{
  "owner_id": 104,
  "categary_name": "laptop",
  "categary_data": [
    {
      "id": 16,
      "description_scrore": 93,
      "found_location": [{
        "location": "new_building",
        "floor_id": 2,
        "hall_name": "F302"
      }]
    }
  ],
  "description_match_cofidence": 90,
  "owner_location": "new_building",
  "floor_id": null,
  "hall_name": null,
  "owner_location_confidence_stage": 2
}
```

Expected response:
```json
{
  "success": true,
  "location_match": true,
  "matched_item_ids": [16, 17, 6, 99],
  "matched_locations": ["new_building", "engineering_faculty", "new_building_entrance"]
}
```

---

## 📁 Important Files

| File | Purpose |
|------|---------|
| `src/pages/SimilarityInputPage.tsx` | Form to collect data |
| `src/services/locationMatchService.ts` | Calls Python backend |
| `src/pages/ItemSelectionPage.tsx` | Shows matched items |
| `PYTHON_BACKEND_INTEGRATION.md` | Full documentation |
| `TEST_API.md` | API testing guide |

---

## 🎨 UI Flow

```
📝 Input Page
    ↓ (Click "Find Matches")
⏳ Loading...
    ↓ (API Call)
🎯 Python Backend
    ↓ (Returns matched IDs)
✅ Matched Items Page
    ↓ (Select items)
📋 Item Details Page
```

---

## ⚙️ Configuration

### Change Backend URL
Edit `src/services/locationMatchService.ts`:
```typescript
const PYTHON_API_URL = 'http://127.0.0.1:5000/api/find-items';
```

### Change Timeout
Edit `src/services/locationMatchService.ts`:
```typescript
timeout: 30000, // milliseconds
```

---

## 💡 Tips

1. **Score Format**: UI uses 0-100 (not 0-1)
2. **Location Names**: Must match exactly (case-sensitive)
3. **Floor/Hall**: Only for `new_building` location
4. **Matched Items**: Only matched items are shown
5. **Selection Limit**: Can select 1-5 items maximum

---

## 📞 Need Help?

1. Check browser console (F12) for errors
2. Check Python backend terminal for logs
3. Verify all services are running
4. Review `PYTHON_BACKEND_INTEGRATION.md` for details
5. Try the test data example above

---

## ✨ Success Checklist

- [ ] Python backend running on port 5000
- [ ] Suggestion UI running on port 5173
- [ ] Form accepts all fields
- [ ] "Find Matches" button works
- [ ] API call succeeds (check console)
- [ ] Matched items display correctly
- [ ] Can select and view items
- [ ] Navigation works both ways

**All checked?** 🎉 You're good to go!
