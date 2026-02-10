# Quick Fix Guide - CORS and Port Conflicts

## Problem Solved
Both Python backend and Node.js Backend were trying to use port 5000, causing conflicts.

## Solution Applied

### Port Configuration:
- **Node.js Backend**: `http://localhost:5000` (Main API server)
- **Python Backend**: `http://127.0.0.1:5001` (Location matching service)
- **Suggestion_UI**: `http://localhost:5173` (React frontend)

## Steps to Run Everything

### 1. Install flask-cors for Python Backend

```powershell
cd "c:\Users\pc\Downloads\Research\PP1\FindAssure---Lost-Found-System---Research-Project\Sugestion_python"
pip install flask-cors
```

### 2. Start Python Backend (Port 5001)

```powershell
cd "c:\Users\pc\Downloads\Research\PP1\FindAssure---Lost-Found-System---Research-Project\Sugestion_python"
python app.py
```

You should see:
```
 * Running on http://0.0.0.0:5001
```

### 3. Start Node.js Backend (Port 5000)

```powershell
cd "c:\Users\pc\Downloads\Research\PP1\FindAssure---Lost-Found-System---Research-Project\Backend"
npm run dev
```

You should see:
```
🚀 Server running on port 5000
✅ MongoDB connected successfully
```

### 4. Start Suggestion_UI (Port 5173)

```powershell
cd "c:\Users\pc\Downloads\Research\PP1\FindAssure---Lost-Found-System---Research-Project\Suggestion_UI"
npm run dev
```

You should see:
```
VITE ready in xxx ms
➜  Local:   http://localhost:5173/
```

## Testing the Setup

1. Open browser to `http://localhost:5173`
2. Fill in the form with your MongoDB ObjectIds
3. Click "Find Matches" - should call Python backend on port 5001
4. Select items - should call Node.js backend on port 5000 for details

## Troubleshooting

### Python Backend CORS Error
**Error**: "Access to XMLHttpRequest blocked by CORS policy"

**Fix**:
1. Ensure flask-cors is installed: `pip install flask-cors`
2. Restart Python backend
3. Check terminal shows: `Running on http://0.0.0.0:5001`

### Node.js Backend CORS Error
**Error**: "Access to XMLHttpRequest at http://localhost:5000 blocked"

**Solution**: CORS already configured. Just ensure:
1. Backend is running on port 5000
2. No other service is using port 5000
3. Check `Backend/.env` has `PORT=5000`

### Port Already in Use
**Error**: "Address already in use"

**Windows Fix**:
```powershell
# Find what's using the port
netstat -ano | findstr :5000
netstat -ano | findstr :5001

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

### Cannot Connect to Backend
1. Check all three servers are running in separate terminals
2. Verify ports:
   - Python: 5001
   - Node.js: 5000
   - React: 5173
3. Check firewall isn't blocking connections

## Quick Test Commands

### Test Python Backend (Port 5001)
```powershell
curl http://127.0.0.1:5001/api/find-items -Method POST -ContentType "application/json" -Body '{"owner_id":"test","categary_name":"test","categary_data":[],"description_match_cofidence":90,"owner_location":"test","floor_id":null,"hall_name":null,"owner_location_confidence_stage":2}'
```

### Test Node.js Backend (Port 5000)
Open browser: `http://localhost:5000/api/health` (if health endpoint exists)

### Test Suggestion_UI
Open browser: `http://localhost:5173`

## What Was Changed

### Files Modified:

1. **Sugestion_python/app.py**
   - Added `from flask_cors import CORS`
   - Added `CORS(app)` to enable CORS
   - Changed port from 5000 → 5001
   - Added `host='0.0.0.0'` for network access

2. **Suggestion_UI/src/services/locationMatchService.ts**
   - Updated URL: `http://127.0.0.1:5000` → `http://127.0.0.1:5001`

3. **Sugestion_python/requirements.txt** (Created)
   - Added flask-cors dependency

## Summary

✅ **CORS enabled** on Python backend
✅ **Port conflict resolved** (Python: 5001, Node.js: 5000)
✅ **MongoDB ObjectId support** added
✅ **Location parsing bug fixed**
✅ **All endpoints updated**

Now all three services can run simultaneously without conflicts! 🚀
