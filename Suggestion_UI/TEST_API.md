# Test Python Backend API

This script demonstrates how to test the Python backend API directly.

## Using PowerShell

```powershell
# Test Request
$body = @{
    owner_id = 104
    categary_name = "laptop"
    categary_data = @(
        @{
            id = 16
            description_scrore = 93
            found_location = @(
                @{
                    location = "new_building"
                    floor_id = 2
                    hall_name = "F302"
                }
            )
        },
        @{
            id = 17
            description_scrore = 88
            found_location = @(
                @{
                    location = "new_building"
                    floor_id = 1
                    hall_name = "passage_1"
                }
            )
        },
        @{
            id = 6
            description_scrore = 95
            found_location = @(
                @{
                    location = "engineering_faculty"
                    floor_id = $null
                    hall_name = $null
                }
            )
        }
    )
    description_match_cofidence = 90
    owner_location = "new_building"
    floor_id = $null
    hall_name = $null
    owner_location_confidence_stage = 2
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri "http://127.0.0.1:5000/api/find-items" -Method POST -Body $body -ContentType "application/json"
```

## Using curl

```bash
curl -X POST http://127.0.0.1:5000/api/find-items \
  -H "Content-Type: application/json" \
  -d '{
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
            "location": "new_building",
            "floor_id": 1,
            "hall_name": "passage_1"
          }
        ]
      },
      {
        "id": 6,
        "description_scrore": 95,
        "found_location": [
          {
            "location": "engineering_faculty",
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
  }'
```

## Expected Response

```json
{
  "location_match": true,
  "matched_item_ids": [16, 17, 6],
  "matched_locations": ["engineering_faculty", "new_building"],
  "success": true
}
```

## Browser Console Test

Open browser console (F12) and run:

```javascript
fetch('http://127.0.0.1:5000/api/find-items', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    owner_id: 104,
    categary_name: "laptop",
    categary_data: [
      {
        id: 16,
        description_scrore: 93,
        found_location: [
          {
            location: "new_building",
            floor_id: 2,
            hall_name: "F302"
          }
        ]
      },
      {
        id: 17,
        description_scrore: 88,
        found_location: [
          {
            location: "new_building",
            floor_id: 1,
            hall_name: "passage_1"
          }
        ]
      }
    ],
    description_match_cofidence: 90,
    owner_location: "new_building",
    floor_id: null,
    hall_name: null,
    owner_location_confidence_stage: 2
  })
})
.then(response => response.json())
.then(data => console.log('Success:', data))
.catch(error => console.error('Error:', error));
```
