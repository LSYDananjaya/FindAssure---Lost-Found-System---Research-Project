# 🚀 FindAssure Backend - Quick Reference

## Start Development Server
```bash
cd Backend
npm install
cp .env.example .env
# Edit .env with your credentials
npm run dev
```

## Essential URLs
- **Health Check:** http://localhost:5000/health
- **API Base:** http://localhost:5000/api
- **Frontend URL:** http://localhost:8081

## Environment Variables (Required)
```env
MONGODB_URI=mongodb://localhost:27017/findassure
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."
PORT=5000
NODE_ENV=development
```

## Quick API Test
```bash
# Health check
curl http://localhost:5000/health

# List found items
curl http://localhost:5000/api/items/found

# Create found item
curl -X POST http://localhost:5000/api/items/found \
  -H "Content-Type: application/json" \
  -d '{"imageUrl":"https://...", "category":"Electronics", ...}'
```

## Key Endpoints

### Public
- `GET /health` - Health check
- `GET /api/items/found` - List found items
- `GET /api/items/found/:id` - Get item details
- `POST /api/items/found` - Report found item

### Authenticated (Bearer Token)
- `GET /api/auth/me` - Get profile
- `PATCH /api/auth/me` - Update profile
- `POST /api/items/lost` - Report lost item
- `GET /api/items/lost/me` - My lost reports
- `POST /api/items/verification` - Submit verification

### Admin Only
- `GET /api/admin/overview` - Dashboard stats
- `GET /api/admin/found-items` - All items (full details)
- `PATCH /api/admin/found-items/:id` - Update item
- `GET /api/admin/users` - All users
- `GET /api/admin/verifications` - All verifications

## Create Admin User
```javascript
// MongoDB Shell
db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { role: "admin" } }
)
```

## Common Issues

### MongoDB Connection Failed
- Check MongoDB is running: `net start MongoDB` (Windows)
- Verify MONGODB_URI in .env

### Firebase Auth Failed
- Check Firebase credentials in .env
- Ensure private key includes \n characters
- Verify Firebase project is active

### Port Already in Use
- Change PORT in .env
- Or kill process: `netstat -ano | findstr :5000` then `taskkill /PID <pid> /F`

## Project Structure
```
Backend/src/
├── app.ts              - Express setup
├── server.ts           - Server start
├── config/             - DB & Firebase
├── middleware/         - Auth & errors
├── models/             - Mongoose schemas
├── controllers/        - Request handlers
├── routes/             - API routes
├── services/           - Business logic
└── utils/              - Helpers
```

## Important Security Notes
- ✅ Founder answers hidden from owners
- ✅ Admin sees all details
- ✅ Firebase token required for protected routes
- ✅ Role-based access control
- ✅ Input validation on all endpoints

## Build & Deploy
```bash
# Build
npm run build

# Start production
npm start

# Or deploy to:
# - Railway: railway up
# - Render: Push to GitHub
# - Heroku: git push heroku main
```

## Documentation Files
- `README.md` - Overview
- `SETUP_GUIDE.md` - Detailed setup
- `API_DOCUMENTATION.md` - API reference
- `TESTING_DEPLOYMENT.md` - Testing & deploy
- `COPILOT_BACKEND.md` - AI context

## Dependencies
```json
{
  "express": "REST API framework",
  "mongoose": "MongoDB ODM",
  "firebase-admin": "Auth verification",
  "typescript": "Type safety",
  "cors": "Cross-origin requests",
  "dotenv": "Environment variables"
}
```

## Test Checklist
- [ ] MongoDB connected
- [ ] Firebase initialized
- [ ] Health check responds
- [ ] Create found item works
- [ ] List items works
- [ ] Auth token verification works
- [ ] Admin endpoints protected
- [ ] Frontend can connect
- [ ] Error handling works

## Support
Check detailed guides for more information:
- Setup issues → SETUP_GUIDE.md
- API usage → API_DOCUMENTATION.md
- Deployment → TESTING_DEPLOYMENT.md

---
**Status:** ✅ Fully Implemented & Ready for Testing
**Version:** 1.0.0
**Date:** December 1, 2025
