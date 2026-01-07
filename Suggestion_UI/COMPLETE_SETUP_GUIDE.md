# Location-Based Item Suggestion System - Setup Guide

## Architecture Overview

This system consists of **THREE** separate services that work together:

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  Suggestion_UI (React)                             │
│  Port: 5173                                        │
│  Purpose: User interface                           │
│                                                     │
└──────────────┬──────────────────┬───────────────────┘
               │                  │
               │ Fetch Items      │ Match Locations
               │                  │
               ▼                  ▼
┌──────────────────────┐  ┌──────────────────────┐
│ Node.js Backend      │  │ Python Backend       │
│ Port: 5000          │  │ Port: 5001          │
│ MongoDB Database     │  │ Location Matching    │
│ CRUD Operations      │  │ Algorithm            │
└──────────────────────┘  └──────────────────────┘
```

## Prerequisites

- **Node.js** v16+ 
- **Python** 3.8+
- **MongoDB** (running locally or cloud)

## Step-by-Step Setup

### Step 1: Install Python Dependencies

```powershell
cd "c:\Users\pc\Downloads\Research\PP1\FindAssure---Lost-Found-System---Research-Project\Sugestion_python"
pip install flask flask-cors
```

### Step 2: Install Node.js Backend Dependencies

```powershell
cd "c:\Users\pc\Downloads\Research\PP1\FindAssure---Lost-Found-System---Research-Project\Backend"
npm install
```

Make sure your `.env` file exists with:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_PRIVATE_KEY=your_private_key
```

### Step 3: Install Suggestion_UI Dependencies

```powershell
cd "c:\Users\pc\Downloads\Research\PP1\FindAssure---Lost-Found-System---Research-Project\Suggestion_UI"
npm install
```

## Running the System

You need **THREE** separate terminal windows:

### Terminal 1: Start Python Backend (Port 5001)

```powershell
cd "c:\Users\pc\Downloads\Research\PP1\FindAssure---Lost-Found-System---Research-Project\Sugestion_python"
python app.py
```

✅ Should see: `Running on http://0.0.0.0:5001`

### Terminal 2: Start Node.js Backend (Port 5000)

```powershell
cd "c:\Users\pc\Downloads\Research\PP1\FindAssure---Lost-Found-System---Research-Project\Backend"
npm run dev
```

✅ Should see:
```
🚀 Server running on port 5000
✅ MongoDB connected successfully
```

### Terminal 3: Start Suggestion_UI (Port 5173)

```powershell
cd "c:\Users\pc\Downloads\Research\PP1\FindAssure---Lost-Found-System---Research-Project\Suggestion_UI"
npm run dev
```

✅ Should see:
```
VITE ready in xxx ms
➜  Local:   http://localhost:5173/
```

## API Endpoints

### Node.js Backend (Port 5000)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `http://localhost:5000/api/items/found` | GET | List all found items |
| `http://localhost:5000/api/items/found/batch` | POST | Get items by IDs |
| `http://localhost:5000/api/items/users` | GET | Get all users |

### Python Backend (Port 5001)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `http://127.0.0.1:5001/api/find-items` | POST | Match items by location |

## Testing the Setup

### 1. Test Node.js Backend

Open browser: `http://localhost:5000/health`

Should return:
```json
{
  "status": "ok",
  "message": "FindAssure Backend API is running",
  "timestamp": "..."
}
```

### 2. Test Python Backend

```powershell
curl http://127.0.0.1:5001/api/find-items -Method POST -ContentType "application/json" -Body '{"owner_id":"test","categary_name":"laptop","categary_data":[],"description_match_cofidence":90,"owner_location":"new_building","floor_id":null,"hall_name":null,"owner_location_confidence_stage":2}'
```

### 3. Test Suggestion_UI

Open browser: `http://localhost:5173`

Fill in the form and click "Find Matches"

## Troubleshooting

### Error: 404 Not Found from port 5001

**Problem**: Trying to fetch items from Python backend instead of Node.js backend

**Solution**: Already fixed! The API config now correctly points to:
- Node.js (Port 5000) for items/users
- Python (Port 5001) for location matching

### Error: CORS Policy Blocked

**Problem**: Backend not allowing requests from frontend

**Solutions**:
1. **Python Backend**: Install flask-cors: `pip install flask-cors`
2. **Node.js Backend**: CORS already configured for `localhost:5173`
3. Restart both backends after installing

### Error: Port Already in Use

**Problem**: Another service is using the port

**Solution**:
```powershell
# Find what's using the port
netstat -ano | findstr :5000
netstat -ano | findstr :5001

# Kill the process (replace PID)
taskkill /PID <PID> /F
```

### Error: MongoDB Connection Failed

**Problem**: Cannot connect to MongoDB

**Solution**: 
1. Check MongoDB is running
2. Verify `MONGODB_URI` in Backend `.env`
3. Check firewall/network settings

### Error: Cannot Find Module

**Problem**: Dependencies not installed

**Solution**: Run `npm install` or `pip install` again

## Data Flow Example

1. **User fills form** in Suggestion_UI (Port 5173)
2. **Clicks "Find Matches"**
3. → Calls Python Backend (Port 5001) to match locations
4. ← Receives matched item IDs
5. **User selects items**
6. → Calls Node.js Backend (Port 5000) to fetch item details
7. ← Receives full item information
8. **Displays items** to user

## Environment Variables

Create `.env` in Suggestion_UI (optional):

```env
VITE_BACKEND_API_URL=http://localhost:5000/api
VITE_PYTHON_API_URL=http://127.0.0.1:5001
```

If not set, defaults are used.

## Quick Commands Summary

```powershell
# Python Backend
cd Sugestion_python
python app.py

# Node.js Backend
cd Backend
npm run dev

# Suggestion UI
cd Suggestion_UI
npm run dev
```

## Port Reference

- **5173** - Suggestion_UI (React)
- **5000** - Node.js Backend (Items/Users API)
- **5001** - Python Backend (Location Matching)

## Need Help?

Check the console logs in all three terminals for detailed error messages!
