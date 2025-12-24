# System Architecture and Flow Diagrams

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Browser                            │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │          Suggestion_UI (React + TypeScript)              │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │  │
│  │  │ Input Page   │  │ Selection    │  │ Details      │   │  │
│  │  │ (Form Data)  │→ │ Page (Match) │→ │ Page (Full)  │   │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘   │  │
│  └─────────────┬────────────────────────────────────────────┘  │
└────────────────┼───────────────────────────────────────────────┘
                 │ HTTP POST
                 │ /api/find-items
                 ↓
┌─────────────────────────────────────────────────────────────────┐
│              Python Backend (Flask)                             │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │         Location Matching Service                         │  │
│  │  ┌─────────────────┐      ┌─────────────────┐           │  │
│  │  │ Request Handler │  →   │ Match Algorithm │           │  │
│  │  └─────────────────┘      └─────────────────┘           │  │
│  └───────────────────────────────────────────────────────────┘  │
│  http://127.0.0.1:5000                                          │
└─────────────────────────────────────────────────────────────────┘
```

## Detailed Request Flow

```
┌──────────────┐
│ User fills   │
│ form with:   │
│ - Owner info │
│ - Items      │
│ - Locations  │
└──────┬───────┘
       │
       ↓
┌─────────────────────────────────────┐
│ SimilarityInputPage validates:      │
│ ✓ Owner ID exists                   │
│ ✓ Category name filled              │
│ ✓ Location selected                 │
│ ✓ At least one item added           │
└──────┬──────────────────────────────┘
       │ Click "Find Matches"
       ↓
┌─────────────────────────────────────┐
│ locationMatchService transforms:    │
│                                      │
│ UI Format         → Python Format   │
│ ownerId: "104"    → owner_id: 104   │
│ score: 93         → score: 93       │
│ location data     → nested objects  │
└──────┬──────────────────────────────┘
       │ axios.post()
       ↓
┌─────────────────────────────────────┐
│ HTTP POST Request                   │
│ URL: http://127.0.0.1:5000         │
│ Endpoint: /api/find-items           │
│ Headers: Content-Type: JSON         │
│ Body: PythonBackendRequest          │
│ Timeout: 30 seconds                 │
└──────┬──────────────────────────────┘
       │
       ↓
┌─────────────────────────────────────┐
│ Python Backend processes:           │
│ 1. Receives request                 │
│ 2. Validates data                   │
│ 3. Runs location matching algorithm │
│ 4. Filters by location proximity    │
│ 5. Returns matched item IDs         │
└──────┬──────────────────────────────┘
       │
       ↓
┌─────────────────────────────────────┐
│ Response received:                  │
│ {                                    │
│   success: true,                    │
│   location_match: true,             │
│   matched_item_ids: [16,17,6],     │
│   matched_locations: [...]          │
│ }                                    │
└──────┬──────────────────────────────┘
       │
       ↓
┌─────────────────────────────────────┐
│ Store in sessionStorage:            │
│ - originalData (all items)          │
│ - matchedItemIds (filtered)         │
│ - locationMatch (boolean)           │
│ - matchedLocations (array)          │
└──────┬──────────────────────────────┘
       │ navigate('/select-items')
       ↓
┌─────────────────────────────────────┐
│ ItemSelectionPage:                  │
│ 1. Reads sessionStorage             │
│ 2. Filters items by matched IDs     │
│ 3. Displays only matched items      │
│ 4. Shows match status banner        │
└──────┬──────────────────────────────┘
       │ User selects items (1-5)
       ↓
┌─────────────────────────────────────┐
│ ItemDetailsPage:                    │
│ - Fetches full item details         │
│ - Displays comprehensive info       │
└─────────────────────────────────────┘
```

## Data Transformation Flow

```
┌─────────────────────────────────────┐
│ UI Input Form                       │
│ ┌─────────────────────────────────┐ │
│ │ Owner ID: "104"                 │ │
│ │ Category: "laptop"              │ │
│ │ Description Conf: 90            │ │
│ │ Owner Loc: "new_building"       │ │
│ │ Stage: 2                        │ │
│ │                                 │ │
│ │ Items:                          │ │
│ │ [                               │ │
│ │   {                             │ │
│ │     itemId: "16",               │ │
│ │     similarityScore: 93,        │ │
│ │     location: "new_building",   │ │
│ │     floorId: 2,                 │ │
│ │     hallName: "F302"            │ │
│ │   }                             │ │
│ │ ]                               │ │
│ └─────────────────────────────────┘ │
└──────────┬──────────────────────────┘
           │ Transform
           ↓
┌─────────────────────────────────────┐
│ Python Backend Request              │
│ ┌─────────────────────────────────┐ │
│ │ {                               │ │
│ │   "owner_id": 104,              │ │
│ │   "categary_name": "laptop",    │ │
│ │   "description_match_cofidence": │ │
│ │      90,                        │ │
│ │   "owner_location":             │ │
│ │      "new_building",            │ │
│ │   "floor_id": null,             │ │
│ │   "hall_name": null,            │ │
│ │   "owner_location_confidence_   │ │
│ │      stage": 2,                 │ │
│ │   "categary_data": [            │ │
│ │     {                           │ │
│ │       "id": 16,                 │ │
│ │       "description_scrore": 93, │ │
│ │       "found_location": [       │ │
│ │         {                       │ │
│ │           "location":           │ │
│ │             "new_building",     │ │
│ │           "floor_id": 2,        │ │
│ │           "hall_name": "F302"   │ │
│ │         }                       │ │
│ │       ]                         │ │
│ │     }                           │ │
│ │   ]                             │ │
│ │ }                               │ │
│ └─────────────────────────────────┘ │
└──────────┬──────────────────────────┘
           │ Process
           ↓
┌─────────────────────────────────────┐
│ Python Backend Response             │
│ ┌─────────────────────────────────┐ │
│ │ {                               │ │
│ │   "success": true,              │ │
│ │   "location_match": true,       │ │
│ │   "matched_item_ids": [         │ │
│ │     16, 17, 18, 6, 99           │ │
│ │   ],                            │ │
│ │   "matched_locations": [        │ │
│ │     "new_building",             │ │
│ │     "engineering_faculty"       │ │
│ │   ]                             │ │
│ │ }                               │ │
│ └─────────────────────────────────┘ │
└──────────┬──────────────────────────┘
           │ Filter
           ↓
┌─────────────────────────────────────┐
│ Displayed Items                     │
│ ┌─────────────────────────────────┐ │
│ │ Only items with IDs:            │ │
│ │ [16, 17, 18, 6, 99]             │ │
│ │                                 │ │
│ │ ✓ Item 16 - Score 93            │ │
│ │ ✓ Item 17 - Score 88            │ │
│ │ ✓ Item 18 - Score 85            │ │
│ │ ✓ Item 6  - Score 95            │ │
│ │ ✓ Item 99 - Score 95            │ │
│ │                                 │ │
│ │ X Item 7  - Not matched         │ │
│ │ X Item 8  - Not matched         │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

## Component Interaction Diagram

```
┌────────────────────────────────────────────────────────┐
│                    App Component                       │
│                   (React Router)                       │
└───────────┬───────────┬────────────┬───────────────────┘
            │           │            │
   Route: / │  Route:   │  Route:    │
            │  /select  │  /details  │
            ↓           ↓            ↓
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ Similarity      │ │ Item Selection  │ │ Item Details    │
│ Input Page      │→│ Page            │→│ Page            │
└────────┬────────┘ └────────┬────────┘ └────────┬────────┘
         │                   │                   │
         │ Uses              │ Uses              │ Uses
         ↓                   ↓                   ↓
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ LocationSelector│ │ FilteredItems   │ │ ItemService     │
│ Component       │ │ Component       │ │ (API calls)     │
└────────┬────────┘ └─────────────────┘ └─────────────────┘
         │
         │ Uses
         ↓
┌─────────────────┐
│ Location        │
│ Match Service   │
│ (Python API)    │
└─────────────────┘
         │
         │ HTTP POST
         ↓
┌─────────────────┐
│ Python Backend  │
│ Flask Server    │
│ Port 5000       │
└─────────────────┘
```

## State Management Flow

```
┌───────────────────────────────────────────────────────┐
│                   State Storage                       │
│              (sessionStorage)                         │
│                                                       │
│  Key: 'similarityData'                               │
│  Value: {                                             │
│    ownerId, categoryName, items[], ...              │
│  }                                                    │
│                                                       │
│  Key: 'matchedItemIds'                               │
│  Value: [16, 17, 18, 6, 99]                         │
│                                                       │
│  Key: 'locationMatch'                                │
│  Value: true                                          │
│                                                       │
│  Key: 'matchedLocations'                             │
│  Value: ["new_building", "engineering_faculty"]     │
│                                                       │
│  Key: 'selectedItemIds'                              │
│  Value: [16, 17]  (user selected)                   │
└───────────────────────────────────────────────────────┘
         ↑                    ↓
    Write from          Read from
         │                    │
┌────────┴────────┐  ┌───────┴────────┐
│ Input Page      │  │ Selection Page │
│ (on submit)     │  │ (on load)      │
└─────────────────┘  └────────────────┘
```

## Error Handling Flow

```
┌─────────────────┐
│ User Action     │
└────────┬────────┘
         │
         ↓
┌─────────────────────────────────────┐
│ Try: API Call                       │
└────────┬────────────────────────────┘
         │
         ├─→ Success (200) ──────┐
         │                       │
         ├─→ Network Error       │
         │   (Connection Failed) │
         │   Show: "Backend not  │
         │   running on port     │
         │   5000"               │
         │                       │
         ├─→ Timeout (30s)       │
         │   Show: "Request      │
         │   timed out"          │
         │                       │
         ├─→ Server Error (500)  │
         │   Show: "Server error │
         │   occurred"           │
         │                       │
         └─→ Validation Error    │
             Show: "Invalid data"│
                                 ↓
                         ┌───────────────┐
                         │ Display Error │
                         │ Message to    │
                         │ User          │
                         └───────────────┘
```

## Location Matching Logic (Backend)

```
Input: Owner Location + Item Locations
│
├─→ Stage 1: Exact Match
│   ├─→ location == owner_location
│   └─→ floor_id == owner_floor_id (if building)
│
├─→ Stage 2: Proximity Match
│   ├─→ Same building, different floor
│   └─→ Adjacent buildings
│
├─→ Stage 3: Campus-wide Match
│   ├─→ Same campus area
│   └─→ Common pathways
│
↓
Output: matched_item_ids[]
```

## Performance Considerations

```
┌────────────────────────────────────┐
│ Request Optimization               │
├────────────────────────────────────┤
│ • Single API call per submission   │
│ • 30-second timeout                │
│ • Axios compression                │
│ • JSON payload (~5-10KB)           │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│ Client-side Caching                │
├────────────────────────────────────┤
│ • sessionStorage for results       │
│ • No redundant API calls           │
│ • Fast navigation                  │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│ UI Responsiveness                  │
├────────────────────────────────────┤
│ • Loading states                   │
│ • Optimistic UI updates            │
│ • Smooth transitions               │
└────────────────────────────────────┘
```
