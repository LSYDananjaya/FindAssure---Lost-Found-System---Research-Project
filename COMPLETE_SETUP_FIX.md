# Complete Setup Fix - Database & CORS

## ✅ Issues Fixed

1. **Database didn't exist** → Created `lost_found_db`
2. **Database schema missing** → Created tables
3. **CORS configuration** → Updated for React app

---

## What Was Done

### 1. Created PostgreSQL Database
```sql
CREATE DATABASE lost_found_db;
```

### 2. Created Database Tables
```bash
npm run db:setup
```

This created:
- ✅ `items` table - Stores found items
- ✅ `item_questions` table - Stores Q&A pairs
- ✅ Indexes and triggers

### 3. Updated CORS Configuration

**File: `.env`**
```env
CORS_ORIGIN=http://localhost:5173
```

**File: `server.js`**
- Allows multiple origins (5173, 8080, 3000)
- Handles preflight OPTIONS requests
- Supports mobile apps (no origin check)

### 4. Restarted Backend
Backend is now running with:
- ✅ Database connected
- ✅ CORS configured
- ✅ All endpoints ready

---

## Current Status

✅ **Backend:** Running on http://localhost:3000  
✅ **Database:** PostgreSQL with `lost_found_db`  
✅ **CORS:** Configured for React app  
✅ **Schema:** All tables created  

---

## Testing Steps

### 1. Refresh Your Browser
Hard refresh the React app:
- **Windows:** `Ctrl + Shift + R`
- **Mac:** `Cmd + Shift + R`

### 2. Test the Full Flow

**Step 1: Add Item**
```
Founder ID: FOUNDER001
Category: Electronics
Description: Found a black smartphone with cracked screen
```
Click: **Generate Verification Questions**

**Step 2: Select Questions**
- Check 2-3 questions
- Click: **Continue to Answer**

**Step 3: Answer Questions**
- Provide answers
- Click: **Save Item**

**Step 4: Success!**
- Should see item ID and details
- Item saved to database

---

## Verify Database

Check if data is being saved:

```powershell
# Connect to database
$env:PGPASSWORD="1234"
psql -U postgres -d lost_found_db

# View items
SELECT * FROM items;

# View questions
SELECT * FROM item_questions;

# Exit
\q
```

---

## If You Still See Errors

### Error: "CORS policy"

**Check:**
1. Backend is running on port 3000
2. React app is on port 5173
3. Hard refresh browser

**Fix:**
```powershell
# Restart backend
cd "D:\.SLIIT\RP 2\services\ai-question-service"
npm start
```

### Error: "database does not exist"

**Fix:**
```powershell
# Create database again
$env:PGPASSWORD="1234"
psql -U postgres -c "CREATE DATABASE lost_found_db;"

# Setup schema
cd "D:\.SLIIT\RP 2\services\ai-question-service"
npm run db:setup
```

### Error: "relation does not exist"

**Fix:**
```powershell
# Re-run schema setup
cd "D:\.SLIIT\RP 2\services\ai-question-service"
npm run db:setup
```

### Error: "connect ECONNREFUSED"

**Check:**
1. PostgreSQL is running
2. Password is correct in `.env`
3. Database name is correct

**Verify:**
```powershell
# Test connection
$env:PGPASSWORD="1234"
psql -U postgres -d lost_found_db -c "SELECT 1;"
```

---

## Complete Restart Procedure

If things get messed up, follow this order:

### 1. Stop Everything
```powershell
# Stop backend
Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue

# Close browser tab with React app
```

### 2. Verify Database
```powershell
$env:PGPASSWORD="1234"
psql -U postgres -d lost_found_db -c "\dt"
```

Should show:
```
              List of relations
 Schema |      Name       | Type  |  Owner   
--------+-----------------+-------+----------
 public | item_questions  | table | postgres
 public | items           | table | postgres
```

### 3. Start Backend
```powershell
cd "D:\.SLIIT\RP 2\services\ai-question-service"
npm start
```

Wait for:
```
🚀 AI Question Service running on port 3000
```

### 4. Start Frontend
```powershell
# In a NEW terminal
cd "D:\.SLIIT\RP 2\web"
npm run dev
```

Wait for:
```
Local: http://localhost:5173/
```

### 5. Test
- Open http://localhost:5173
- Fill form and submit
- Should work!

---

## Environment Checklist

Before testing, verify:

- [ ] PostgreSQL is installed and running
- [ ] Database `lost_found_db` exists
- [ ] Tables are created (items, item_questions)
- [ ] `.env` has correct database credentials
- [ ] `.env` has `CORS_ORIGIN=http://localhost:5173`
- [ ] Backend running on port 3000
- [ ] React app running on port 5173
- [ ] No other apps using these ports

---

## Port Reference

| Service | Port | URL |
|---------|------|-----|
| PostgreSQL | 5432 | localhost:5432 |
| Backend API | 3000 | http://localhost:3000 |
| React Web | 5173 | http://localhost:5173 |

---

## Database Schema

### items table
```sql
CREATE TABLE items (
    id SERIAL PRIMARY KEY,
    category VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    founder_id VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### item_questions table
```sql
CREATE TABLE item_questions (
    id SERIAL PRIMARY KEY,
    item_id INTEGER REFERENCES items(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    answer_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Quick Commands

```powershell
# Create database
$env:PGPASSWORD="1234"; psql -U postgres -c "CREATE DATABASE lost_found_db;"

# Setup schema
cd "D:\.SLIIT\RP 2\services\ai-question-service"; npm run db:setup

# Start backend
cd "D:\.SLIIT\RP 2\services\ai-question-service"; npm start

# Start frontend (new terminal)
cd "D:\.SLIIT\RP 2\web"; npm run dev

# Check database
$env:PGPASSWORD="1234"; psql -U postgres -d lost_found_db -c "SELECT * FROM items;"
```

---

## Success Indicators

When everything works:

✅ Backend logs show:
```
🚀 AI Question Service running on port 3000
```

✅ Browser shows no CORS errors

✅ Form submission generates questions

✅ Saving item returns success with ID

✅ Database query shows saved data

---

## Your System Is Now Ready! 🎉

All issues are resolved:
- ✅ Database created and configured
- ✅ Schema tables created
- ✅ CORS configured for React app
- ✅ Backend running properly

**Try testing the full flow now!**
