# lost_and_found
# Location-Based Item Suggestion System

A Python-based backend service that matches lost items with their potential owners using intelligent location-based algorithms. This system uses spatial relationships and confidence stages to recommend items based on where they were found relative to where the owner lost them.

## 🎯 Overview

This system receives item data with similarity scores (from image/description matching) and location information, then uses advanced location-based logic to recommend which items are most likely to belong to the owner. The system adapts its search radius based on confidence levels and location specificity.

## 📋 Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Location Matching Logic](#location-matching-logic)
- [API Documentation](#api-documentation)
- [Installation](#installation)
- [Usage](#usage)
- [Data Structure](#data-structure)
- [Examples](#examples)

## ✨ Features

- **Multi-Stage Confidence Matching**: Adapts search radius based on owner's location confidence (4 stages)
- **Spatial Relationship Mapping**: Uses 6-directional relationships (left, right, front, back, top, bottom)
- **Building-Aware Logic**: Handles both ground locations and multi-floor buildings
- **Floor-Level Granularity**: Supports specific halls, entire floors, or entire buildings
- **Proximity-Based Scoring**: Prioritizes items found closer to the owner's location
- **Flexible Input Format**: Accepts various location specificity levels

## 🏗️ Architecture

```
Sugestion_python/
├── app.py                          # Flask API server
├── ground_location_matcher.py      # Ground location matching logic
├── building_location_matcher.py    # Building location matching logic
├── requirements.txt                # Python dependencies
├── README.md                       # This file
├── data/
│   ├── map.json                   # Campus ground location mapping
│   └── new_building.json          # Building floor/hall mapping
└── test.json                      # Sample test data
```

## 🧠 Location Matching Logic

The system implements different matching strategies based on:
1. **Location Type**: Ground vs Building
2. **Specificity Level**: Exact hall vs Floor vs Entire building
3. **Confidence Stage**: How certain the owner is about their location (1-4)

---

### 📍 Ground Location Logic

**Applies when:** Owner's location is a ground-level area (e.g., basketball_court, juice_bar, road)

#### **Stage 1: Direct Match**
- **Strategy**: Match only the owner's exact location
- **Returns**: Items found at the exact same location
- **Example**: Owner at `basketball_court` → Only show items found at `basketball_court`

#### **Stage 2: Adjacent Areas**
- **Strategy**: Include owner's location + immediate adjacent areas
- **Returns**: Items found at owner's location OR in left/right/front/back/top/bottom of owner's location
- **Example**: Owner at `basketball_court` → Show items at `basketball_court` + `tennis_court` (left) + `volleyball_court` (right) + `play_ground` (front), etc.

#### **Stage 3: Extended Network**
- **Strategy**: Include owner's location + adjacent areas + areas adjacent to those
- **Returns**: Items in a wider radius
- **Example**: Owner at `basketball_court` → Show items at all stage 2 locations + areas adjacent to those locations

---

### 🏢 Building Logic with Floor-ID and Hall

**Applies when:** Owner specifies building + floor + specific hall (e.g., new_building, floor 3, G304)

#### **Stage 1: Exact Hall Match**
- **Strategy**: Match only the specified hall
- **Returns**: Items found in that exact hall
- **Example**: Owner at `new_building, 3rd floor, G304` → Only show items in `G304`

#### **Stage 2: Adjacent Halls**
- **Strategy**: Include target hall + adjacent halls (left/right/front)
- **Returns**: Items in target hall and neighboring halls on same floor
- **Example**: Owner at `G304` → Show items in `G304` + `G303` (left) + `G305` (right) + `passage_3` (front)

#### **Stage 3: Full Floor Context**
- **Strategy**: Include all halls that share adjacency with target hall's neighbors
- **Returns**: Effectively covers the entire floor
- **Example**: Owner at `G304` → Show items across most/all of 3rd floor

---

### 🏢 Building Logic with Floor-ID (No Hall)

**Applies when:** Owner specifies building + floor but no specific hall (e.g., new_building, floor 3)

#### **Stage 1: Entire Floor**
- **Strategy**: Match all halls on the specified floor
- **Returns**: Items found anywhere on that floor
- **Example**: Owner at `new_building, 3rd floor` → Show items in all 3rd floor halls

#### **Stage 2: Adjacent Floors**
- **Strategy**: Include target floor + floors above and below
- **Returns**: Items across 3 floors
- **Example**: Owner at `3rd floor` → Show items on 2nd, 3rd, and 4th floors

#### **Stage 3: Entire Building**
- **Strategy**: Match all floors in the building
- **Returns**: Items found anywhere in the building
- **Example**: Owner at `3rd floor of new_building` → Show items in entire new_building

---

### 🏢 Building Logic without Floor-ID or Hall

**Applies when:** Owner only specifies building name (e.g., new_building)

#### **Stage 1: Entire Building**
- **Strategy**: Match all halls in the building
- **Returns**: Items found anywhere in the building
- **Example**: Owner at `new_building` → Show items in entire new_building

#### **Stage 2: Building + Adjacent Ground Areas**
- **Strategy**: Include entire building + adjacent ground locations
- **Returns**: Items in building and surrounding areas
- **Example**: Owner at `new_building` → Show items in entire new_building + `new_building_entrance` + `engineering_faculty` + `car_park1`, etc.

#### **Stage 3: Extended Building Network**
- **Strategy**: Include building + adjacent areas + areas adjacent to those
- **Returns**: Wide area coverage
- **Example**: Owner at `new_building` → Show items in very large radius around the building

---

## 📡 API Documentation

### Endpoint: `/api/find-items`

**Method:** `POST`

**URL:** `http://127.0.0.1:5001/api/find-items`

#### Request Body

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
    },
    {
      "id": 17,
      "description_scrore": 88,
      "found_location": [
        {
          "location": "basketball_court",
          "floor_id": null,
          "hall_name": null
        }
      ]
    }
  ],
  "description_match_cofidence": 90,
  "owner_location": "new_building",
  "floor_id": null,
  "hall_name": null,
  "owner_location_confidence_stage": 2
}
```

#### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `owner_id` | int/string | Yes | Unique identifier of the item owner |
| `categary_name` | string | Yes | Category of the lost item (e.g., "laptop", "phone") |
| `categary_data` | array | Yes | Array of found items with scores and locations |
| `description_match_cofidence` | int | Yes | Overall confidence in description matching (0-100) |
| `owner_location` | string | Yes | Location where owner lost the item |
| `floor_id` | int/null | Yes | Floor number (null for ground locations) |
| `hall_name` | string/null | Yes | Specific hall name (null if not applicable) |
| `owner_location_confidence_stage` | int | Yes | Owner's location confidence (1-4) |

#### Category Data Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | int/string | Yes | Unique item identifier |
| `description_scrore` | int | Yes | Similarity score from image/description matching (0-100) |
| `found_location` | array | Yes | Array of location objects where item was found |

#### Location Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `location` | string | Yes | Location name (building or ground area) |
| `floor_id` | int/null | Yes | Floor number (null for ground locations) |
| `hall_name` | string/null | Yes | Hall name (null if not applicable) |

#### Response

```json
{
  "location_match": true,
  "matched_item_ids": [16, 17, 18, 19, 20, 6, 99],
  "matched_locations": [
    "engineering_faculty",
    "new_building",
    "new_building_entrance",
    "willium_angliss"
  ],
  "success": true
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `location_match` | boolean | Whether any location matches were found |
| `matched_item_ids` | array | IDs of items that match location criteria |
| `matched_locations` | array | List of locations where matches were found |
| `success` | boolean | Whether the request was processed successfully |

---

## 🚀 Installation

### Prerequisites

- Python 3.7+
- pip (Python package manager)

### Steps

1. **Clone or navigate to the repository**
```bash
cd Sugestion_python
```

2. **Install dependencies**
```bash
pip install -r requirements.txt
```

3. **Verify data files exist**
```bash
# Check that these files are present:
# data/map.json - Ground location mapping
# data/new_building.json - Building floor/hall mapping
```

---

## 💻 Usage

### Starting the Server

```bash
python app.py
```

The server will start on `http://0.0.0.0:5001`

### Testing with curl

```bash
curl -X POST http://127.0.0.1:5001/api/find-items \
  -H "Content-Type: application/json" \
  -d @test.json
```

### Testing with Python requests

```python
import requests
import json

url = "http://127.0.0.1:5001/api/find-items"

data = {
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

response = requests.post(url, json=data)
print(response.json())
```

---

## 📊 Data Structure

### Ground Location Map (`data/map.json`)

```json
[
  {
    "actual_location": "basketball_court",
    "directions": {
      "left": "tennis_court",
      "right": "volleyball_court",
      "top": "n/a",
      "bottom": "n/a",
      "front": "play_ground",
      "back": "road"
    }
  }
]
```

### Building Map (`data/new_building.json`)

```json
[
  {
    "building_name": "new_building",
    "floor_id": 3,
    "hall_name": "G304",
    "directions": {
      "left": "G303",
      "right": "G305",
      "front": "passage_3",
      "back": "n/a",
      "top": "n/a",
      "bottom": "n/a"
    }
  }
]
```

---

## 📝 Examples

### Example 1: Ground Location - Stage 1

**Scenario:** Owner lost item at basketball court (very confident)

**Request:**
```json
{
  "owner_id": 101,
  "categary_name": "wallet",
  "categary_data": [
    {"id": 1, "description_scrore": 95, "found_location": [{"location": "basketball_court", "floor_id": null, "hall_name": null}]},
    {"id": 2, "description_scrore": 90, "found_location": [{"location": "tennis_court", "floor_id": null, "hall_name": null}]}
  ],
  "description_match_cofidence": 92,
  "owner_location": "basketball_court",
  "floor_id": null,
  "hall_name": null,
  "owner_location_confidence_stage": 1
}
```

**Response:**
```json
{
  "location_match": true,
  "matched_item_ids": [1],
  "matched_locations": ["basketball_court"],
  "success": true
}
```

---

### Example 2: Building with Floor and Hall - Stage 2

**Scenario:** Owner lost item in G304 on 3rd floor (moderately confident)

**Request:**
```json
{
  "owner_id": 102,
  "categary_name": "laptop",
  "categary_data": [
    {"id": 10, "description_scrore": 88, "found_location": [{"location": "new_building", "floor_id": 3, "hall_name": "G304"}]},
    {"id": 11, "description_scrore": 85, "found_location": [{"location": "new_building", "floor_id": 3, "hall_name": "G303"}]},
    {"id": 12, "description_scrore": 80, "found_location": [{"location": "new_building", "floor_id": 2, "hall_name": "F302"}]}
  ],
  "description_match_cofidence": 85,
  "owner_location": "new_building",
  "floor_id": 3,
  "hall_name": "G304",
  "owner_location_confidence_stage": 2
}
```

**Response:**
```json
{
  "location_match": true,
  "matched_item_ids": [10, 11],
  "matched_locations": ["new_building"],
  "success": true
}
```

---

### Example 3: Building Only - Stage 3

**Scenario:** Owner lost item somewhere in new building (low confidence)

**Request:**
```json
{
  "owner_id": 103,
  "categary_name": "phone",
  "categary_data": [
    {"id": 20, "description_scrore": 92, "found_location": [{"location": "new_building", "floor_id": 1, "hall_name": "F101"}]},
    {"id": 21, "description_scrore": 88, "found_location": [{"location": "engineering_faculty", "floor_id": null, "hall_name": null}]},
    {"id": 22, "description_scrore": 85, "found_location": [{"location": "new_building_entrance", "floor_id": null, "hall_name": null}]}
  ],
  "description_match_cofidence": 90,
  "owner_location": "new_building",
  "floor_id": null,
  "hall_name": null,
  "owner_location_confidence_stage": 3
}
```

**Response:**
```json
{
  "location_match": true,
  "matched_item_ids": [20, 21, 22],
  "matched_locations": ["new_building", "engineering_faculty", "new_building_entrance"],
  "success": true
}
```

---

## 🔧 Configuration

### Changing Server Port

Edit `app.py`:
```python
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)  # Change port here
```

### Adding New Locations

**For Ground Locations:** Edit `data/map.json`
```json
{
  "actual_location": "new_location_name",
  "directions": {
    "left": "adjacent_location_left",
    "right": "adjacent_location_right",
    "front": "adjacent_location_front",
    "back": "adjacent_location_back",
    "top": "n/a",
    "bottom": "n/a"
  }
}
```

**For Building Locations:** Edit `data/new_building.json`
```json
{
  "building_name": "building_name",
  "floor_id": 1,
  "hall_name": "hall_name",
  "directions": {
    "left": "hall_to_left",
    "right": "hall_to_right",
    "front": "hall_in_front",
    "back": "n/a",
    "top": "n/a",
    "bottom": "n/a"
  }
}
```

---

## 🐛 Troubleshooting

### Common Issues

1. **Server won't start**
   - Check if port 5001 is already in use
   - Verify all dependencies are installed: `pip install -r requirements.txt`

2. **No matches found**
   - Verify location names exactly match those in `map.json` or `new_building.json`
   - Check that confidence stage is appropriate (1-4)
   - Ensure found items have valid location data

3. **Import errors**
   - Make sure you're in the `Sugestion_python` directory
   - Reinstall dependencies: `pip install -r requirements.txt`

---

## 🤝 Integration with Frontend

This backend integrates with the Suggestion_UI React application. The frontend:

1. Collects owner information and found items
2. Sends POST request to `/api/find-items`
3. Receives matched item IDs
4. Displays matched items for owner selection

**Frontend Configuration:**
```typescript
// Suggestion_UI/src/config/api.ts
export const PYTHON_API_BASE_URL = 'http://127.0.0.1:5001';
```

---

## 📚 Algorithm Details

### Confidence Stage Decision Tree

```
Is owner location a building?
├─ YES → Building Logic
│   ├─ Has floor_id AND hall_name?
│   │   ├─ YES → Building with Hall Logic (Stage 1-3)
│   │   └─ NO → Has floor_id only?
│   │       ├─ YES → Building with Floor Logic (Stage 1-3)
│   │       └─ NO → Building Only Logic (Stage 1-3)
│   └─ NO → Ground Location Logic
│       └─ Apply Stage 1-3 based on confidence
```

### Matching Priority

Items are matched in this order:
1. **Exact location match** (highest priority)
2. **Adjacent location match**
3. **Extended network match**
4. **Description similarity score** (tie-breaker)

---

## 📄 License

This project is part of the FindAssure Lost & Found System research project.

---

## 👥 Contributors

- **Your Name** - Location-based suggestion algorithm development
- **Team Member 2** - Image and description matching
- **Team Member 3** - Frontend development

---

## 📞 Support

For issues or questions:
- Check the troubleshooting section
- Review the examples
- Contact the development team

---

## 🔄 Version History

- **v1.0.0** - Initial release
  - Ground location matching (3 stages)
  - Building location matching (multiple configurations)
  - Flask REST API
  - CORS support

---

## 🎓 Research Context

This system is part of a research project investigating intelligent lost and found systems using:
- Computer vision for item similarity matching
- Spatial reasoning for location-based recommendations
- Confidence-based adaptive algorithms
- User behavior modeling

**Key Innovation:** Adaptive search radius based on user confidence and location specificity, reducing false positives while maintaining high recall rates.

---