# 🚀 QUICK REFERENCE CARD

## Essential Commands

### Backend Service

```bash
# Location
cd D:\.SLIIT\RP 2\services\ai-question-service

# Install
npm install

# Setup Database
npm run db:setup

# Run Development
npm run dev

# Run Production
npm start
```

### Mobile App

```bash
# Location
cd D:\.SLIIT\RP 2\mobile\flutter_app

# Install
flutter pub get

# Run
flutter run

# Build
flutter build apk --release
```

---

## 📡 API Quick Reference

### Base URL
```
http://localhost:3000
```

### Endpoints

**Health Check**
```http
GET /health
```

**Generate Questions**
```http
POST /api/questions/generate
Content-Type: application/json

{
  "category": "Electronics",
  "description": "Black iPhone 13 Pro with blue case"
}
```

**Create Item**
```http
POST /api/items/create
Content-Type: application/json

{
  "category": "Electronics",
  "description": "Black iPhone 13 Pro",
  "founderId": "founder_123",
  "questions": [
    {
      "question": "What model?",
      "founderAnswer": "iPhone 13 Pro"
    }
  ]
}
```

**Get Item**
```http
GET /api/items/:itemId
```

**Get All Items**
```http
GET /api/items
```

---

## 🗄️ Database Quick Reference

### Connect to Database
```bash
psql -U postgres -d lost_found_db
```

### Useful Queries
```sql
-- View all items
SELECT * FROM items;

-- View all questions
SELECT * FROM item_questions;

-- View item with questions
SELECT i.*, iq.question, iq.founder_answer
FROM items i
LEFT JOIN item_questions iq ON i.id = iq.item_id
WHERE i.id = 1;

-- Count items
SELECT COUNT(*) FROM items;

-- Reset database
DELETE FROM items;
ALTER SEQUENCE items_id_seq RESTART WITH 1;
```

---

## 🔧 Configuration Quick Reference

### Backend (.env)
```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=lost_found_db
DB_USER=postgres
DB_PASSWORD=your_password
CLAUDE_API_KEY=your_key
CLAUDE_MODEL=claude-sonnet-4-20250514
```

### Mobile (api_service.dart)
```dart
// Android Emulator
static const String baseUrl = 'http://10.0.2.2:3000';

// iOS Simulator
static const String baseUrl = 'http://localhost:3000';

// Physical Device
static const String baseUrl = 'http://YOUR_IP:3000';
```

---

## 🐛 Troubleshooting Quick Fixes

### Backend won't start
```bash
# Check PostgreSQL
sc query postgresql-x64-13

# Restart PostgreSQL
sc stop postgresql-x64-13
sc start postgresql-x64-13

# Recreate database
psql -U postgres
DROP DATABASE lost_found_db;
CREATE DATABASE lost_found_db;
\q

# Rerun schema
npm run db:setup
```

### Mobile can't connect
```bash
# Test backend
curl http://localhost:3000/health

# Check correct IP in api_service.dart
# For Android Emulator: http://10.0.2.2:3000

# Rebuild app
flutter clean
flutter pub get
flutter run
```

### Claude API errors
```
# Verify API key in .env
# Check credits at console.anthropic.com
# Ensure correct model name
```

---

## 📊 Project Structure Overview

```
D:\.SLIIT\RP 2\
├── services/ai-question-service/  # Backend
│   └── src/                       # 11 files
├── mobile/flutter_app/            # Mobile
│   └── lib/                       # 9 files
└── *.md                           # Documentation
```

---

## ✅ Verification Checklist

### Backend Running?
- [ ] `curl http://localhost:3000/health` returns healthy
- [ ] No errors in terminal
- [ ] Port 3000 is accessible

### Database Working?
- [ ] PostgreSQL service running
- [ ] Database `lost_found_db` exists
- [ ] Tables `items` and `item_questions` exist

### Mobile Running?
- [ ] App launches without errors
- [ ] Can input item details
- [ ] Generate questions works
- [ ] Can save items

---

## 🎯 Test Flow

1. Open mobile app
2. Enter founder ID: `test_001`
3. Category: `Electronics`
4. Description: `Black iPhone 13 Pro with blue case`
5. Generate questions
6. Select 3-4 questions
7. Answer all
8. Save item
9. Verify success screen shows ID
10. Check backend: `curl http://localhost:3000/api/items/1`

---

## 📞 Documentation Links

| Document | Purpose |
|----------|---------|
| README.md | Main overview |
| SETUP_GUIDE.md | Setup instructions |
| PROJECT_SUMMARY.md | Complete summary |
| FILE_TREE.md | File structure |
| services/.../README.md | Backend docs |
| mobile/.../README.md | Mobile docs |

---

## 🔑 Important Paths

### Backend
```
D:\.SLIIT\RP 2\services\ai-question-service
```

### Mobile
```
D:\.SLIIT\RP 2\mobile\flutter_app
```

### Configuration
```
Backend: services/ai-question-service/.env
Mobile:  mobile/flutter_app/lib/services/api_service.dart
```

---

## 💡 Pro Tips

**Backend**
- Use `npm run dev` for auto-reload during development
- Check logs in terminal for debugging
- Test endpoints with curl or Postman
- Use `console.log()` for debugging

**Mobile**
- Use hot reload: Press `r` in terminal
- Use hot restart: Press `R` in terminal
- Check console for errors
- Use `print()` for debugging

**Database**
- Use pgAdmin for visual management
- Keep database schema in sync
- Backup data before major changes

---

## 🎓 Learning Resources

**Node.js & Express**
- Express docs: expressjs.com
- PostgreSQL docs: postgresql.org
- Claude API: docs.anthropic.com

**Flutter**
- Flutter docs: flutter.dev
- Dart docs: dart.dev
- Material Design: material.io

---

## ⚡ Quick Start (30 seconds)

```bash
# Terminal 1: Backend
cd services/ai-question-service
npm run dev

# Terminal 2: Mobile
cd mobile/flutter_app
flutter run
```

---

## 🎉 Success Indicators

✅ Backend terminal shows: "AI Question Service running on port 3000"
✅ Mobile app launches without errors
✅ Can complete full flow from add item to success
✅ Item appears in database
✅ API endpoints return valid JSON

---

**Keep this card handy for quick reference! 📋**

Last Updated: November 18, 2025
