# 🚀 Quick Setup Guide - AI-Driven Lost & Found System

Complete step-by-step instructions to get the full system running.

## ⚡ Prerequisites Checklist

Before starting, ensure you have:

- [ ] Node.js 16+ installed (`node --version`)
- [ ] PostgreSQL 13+ installed (`psql --version`)
- [ ] Flutter SDK 3.0+ installed (`flutter --version`)
- [ ] Claude API key from Anthropic (https://console.anthropic.com/)
- [ ] Code editor (VS Code recommended)

## 📋 Setup Steps

### Part 1: Backend Service (15 minutes)

#### Step 1: Install Dependencies
```powershell
cd "D:\.SLIIT\RP 2\services\ai-question-service"
npm install
```

#### Step 2: Setup PostgreSQL Database
```powershell
# Open PostgreSQL command line
psql -U postgres

# Inside psql, create database:
CREATE DATABASE lost_found_db;

# Exit psql
\q
```

#### Step 3: Configure Environment Variables
```powershell
# Copy example file
cp .env.example .env

# Edit .env file with your favorite editor
code .env
```

**Update these values in .env:**
```env
PORT=3000
NODE_ENV=development

# PostgreSQL credentials
DB_HOST=localhost
DB_PORT=5432
DB_NAME=lost_found_db
DB_USER=postgres
DB_PASSWORD=YOUR_POSTGRES_PASSWORD

# Claude API key (get from https://console.anthropic.com/)
CLAUDE_API_KEY=YOUR_CLAUDE_API_KEY_HERE
CLAUDE_MODEL=claude-sonnet-4-20250514

# CORS
CORS_ORIGIN=*
```

#### Step 4: Initialize Database Schema
```powershell
npm run db:setup
```

You should see:
```
✓ Database schema created successfully!
✓ Tables created: items, item_questions
✓ Indexes and triggers created
```

#### Step 5: Start Backend Server
```powershell
npm run dev
```

You should see:
```
==================================================
🚀 AI Question Service running on port 3000
📍 Environment: development
🔗 Base URL: http://localhost:3000
💚 Health check: http://localhost:3000/health
==================================================
```

#### Step 6: Test Backend
Open a new terminal and test:
```powershell
# Test health endpoint
curl http://localhost:3000/health

# Expected response:
# {"status":"healthy","service":"ai-question-service","timestamp":"..."}
```

✅ **Backend is ready!**

---

### Part 2: Mobile App (10 minutes)

#### Step 1: Navigate to Flutter App
```powershell
# Open a new terminal
cd "D:\.SLIIT\RP 2\mobile\flutter_app"
```

#### Step 2: Install Flutter Dependencies
```powershell
flutter pub get
```

#### Step 3: Configure API Endpoint

**Option A: Using Android Emulator**
Edit `lib/services/api_service.dart` line 9:
```dart
static const String baseUrl = 'http://10.0.2.2:3000';
```

**Option B: Using iOS Simulator**
```dart
static const String baseUrl = 'http://localhost:3000';
```

**Option C: Using Physical Device**
```dart
static const String baseUrl = 'http://YOUR_COMPUTER_IP:3000';
```

To find your IP:
```powershell
# Windows
ipconfig
# Look for IPv4 Address
```

#### Step 4: Check Connected Devices
```powershell
flutter devices
```

#### Step 5: Run the App
```powershell
flutter run
```

Wait for the app to build and launch...

✅ **Mobile app is ready!**

---

## 🎯 Testing the Complete Flow

### Test Scenario 1: Basic Flow

1. **Open the mobile app**

2. **On Add Item Screen:**
   - Founder ID: `test_founder_001`
   - Category: Select "Electronics"
   - Description: `Black iPhone 13 Pro with blue protective case. Has a small scratch on the bottom left corner of the screen. Case has a Batman sticker on the back.`
   - Click **"Generate Verification Questions"**

3. **On Select Questions Screen:**
   - Wait for AI to generate 8-10 questions
   - Select 3-4 questions by checking boxes
   - Click **"Continue to Answer"**

4. **On Answer Questions Screen:**
   - Fill in answers for each selected question
   - Example answers:
     - "What model is the phone?" → "iPhone 13 Pro"
     - "What color is the case?" → "Blue"
     - "Are there any stickers?" → "Batman sticker on back"
   - Click **"Save Item"**

5. **On Success Screen:**
   - Note the Item ID (e.g., #1)
   - Click "Copy ID" button
   - Verify details are correct

6. **Verify in Backend:**
   ```powershell
   curl http://localhost:3000/api/items/1
   ```

### Test Scenario 2: Different Categories

Test with various categories:
- **Clothing:** "Red Nike hoodie, size M, small coffee stain on left sleeve"
- **Documents:** "Philippine passport, blue cover, expires 2028"
- **Keys:** "Car key with Toyota logo, black rubber key fob"
- **Bags:** "Black Jansport backpack with broken left strap"

---

## 🐛 Common Issues & Solutions

### Issue 1: Backend won't start
**Error:** `Cannot connect to database`

**Solution:**
```powershell
# Check if PostgreSQL is running
sc query postgresql-x64-13

# If not running, start it:
sc start postgresql-x64-13

# Or restart:
sc stop postgresql-x64-13
sc start postgresql-x64-13
```

### Issue 2: Claude API errors
**Error:** `Failed to generate questions: 401 Unauthorized`

**Solution:**
- Verify Claude API key in `.env`
- Check API key is active at https://console.anthropic.com/
- Ensure you have credits available

### Issue 3: Mobile app can't connect
**Error:** `Failed to generate questions: Failed to connect`

**Solutions:**

**A. Backend not running:**
```powershell
cd "D:\.SLIIT\RP 2\services\ai-question-service"
npm run dev
```

**B. Wrong IP address (Android Emulator):**
Edit `lib/services/api_service.dart`:
```dart
static const String baseUrl = 'http://10.0.2.2:3000';
```

**C. Firewall blocking (Physical Device):**
```powershell
# Allow Node.js through Windows Firewall
# Windows Security → Firewall → Allow an app
# Find Node.js and enable
```

**D. Test connection:**
```powershell
# From your computer
curl http://localhost:3000/health

# From browser on physical device
http://YOUR_COMPUTER_IP:3000/health
```

### Issue 4: Flutter build errors
**Error:** Various Flutter errors

**Solution:**
```powershell
flutter clean
flutter pub get
flutter run
```

### Issue 5: Database schema issues
**Error:** `relation "items" does not exist`

**Solution:**
```powershell
cd services/ai-question-service
npm run db:setup
```

---

## 📊 Verify Everything Works

### Backend Checklist
```powershell
# Health check
curl http://localhost:3000/health
# ✅ Should return: {"status":"healthy"...}

# Generate questions
curl -X POST http://localhost:3000/api/questions/generate -H "Content-Type: application/json" -d "{\"category\":\"Electronics\",\"description\":\"Black iPhone\"}"
# ✅ Should return: {"success":true,"data":{"questions":[...]}}

# List items
curl http://localhost:3000/api/items
# ✅ Should return: {"success":true,"data":{"items":[],"count":0}}
```

### Mobile Checklist
- [ ] App launches without errors
- [ ] Can input item details
- [ ] Generate questions button works
- [ ] Questions appear in list
- [ ] Can select questions
- [ ] Can provide answers
- [ ] Save item creates record
- [ ] Success screen shows item ID

---

## 🎓 Next Steps

### Explore the System
1. Create multiple items with different categories
2. View items in database using API
3. Experiment with different descriptions
4. Test error handling (empty fields, etc.)

### Development Tasks
1. Add user authentication
2. Implement claim verification flow
3. Add image upload capability
4. Create admin dashboard
5. Add push notifications

### Production Deployment
1. Deploy backend to cloud (AWS, Azure, GCP)
2. Setup production PostgreSQL database
3. Configure environment variables
4. Build Flutter release APK/IPA
5. Submit to app stores

---

## 📁 Project Structure Overview

```
D:\.SLIIT\RP 2\
│
├── services/
│   └── ai-question-service/          ← Backend (Node.js + Express)
│       ├── src/                      ← Source code
│       ├── .env                      ← Configuration (DO NOT COMMIT)
│       └── package.json              ← Dependencies
│
├── mobile/
│   └── flutter_app/                  ← Mobile app (Flutter)
│       ├── lib/                      ← Dart source code
│       └── pubspec.yaml              ← Dependencies
│
└── README.md                         ← Main documentation
```

---

## 🔑 Important Commands Reference

### Backend
```powershell
# Start development server
npm run dev

# Start production server
npm start

# Setup database
npm run db:setup

# Install dependencies
npm install
```

### Mobile
```powershell
# Install dependencies
flutter pub get

# Run on device
flutter run

# Run on specific device
flutter run -d <device_id>

# Build APK
flutter build apk --release

# Clean build
flutter clean
```

### Database
```powershell
# Connect to PostgreSQL
psql -U postgres

# Connect to specific database
psql -U postgres -d lost_found_db

# List databases
\l

# List tables
\dt

# View data
SELECT * FROM items;
SELECT * FROM item_questions;
```

---

## 🎉 Success!

If you've completed all steps, you now have:
- ✅ Running backend service with AI integration
- ✅ PostgreSQL database with proper schema
- ✅ Flutter mobile app with complete founder flow
- ✅ Full end-to-end functionality

**Test it out and enjoy your AI-Driven Lost & Found System!**

---

## 📞 Need Help?

- **Backend README:** `services/ai-question-service/README.md`
- **Mobile README:** `mobile/flutter_app/README.md`
- **Main README:** `README.md`

**Happy coding! 🚀**
