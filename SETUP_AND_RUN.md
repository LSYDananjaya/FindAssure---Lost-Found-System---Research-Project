# 🚀 Complete Setup and Running Guide

## Overview

This guide will help you set up and run the **React Web Application** for the Lost & Found project. No mobile emulator needed!

---

## ✅ Prerequisites

Before starting, ensure you have:

- ✅ **Node.js** (v16 or higher) - Download from https://nodejs.org/
- ✅ **npm** (comes with Node.js)
- ✅ **PowerShell** or **Command Prompt**
- ✅ **Modern browser** (Chrome, Firefox, Edge)

### Check if Node.js is installed:
```powershell
node --version
npm --version
```

---

## 📦 Installation Steps

### Step 1: Install Web App Dependencies

Open PowerShell in the project root directory:

```powershell
cd "d:\.SLIIT\RP 2\web"
npm install
```

**Expected output:** Installing packages... this may take 1-2 minutes.

### Step 2: Install Backend Dependencies (if not done)

```powershell
cd "d:\.SLIIT\RP 2\services\ai-question-service"
npm install
```

---

## 🎯 Running the Application

You need **TWO terminal windows** running simultaneously:

### Terminal 1: Start the Backend

```powershell
cd "d:\.SLIIT\RP 2\services\ai-question-service"
npm start
```

**You should see:**
```
🚀 AI Question Service running on port 3000
📍 Environment: development
🔗 Base URL: http://localhost:3000
💚 Health check: http://localhost:3000/health
```

✅ Keep this terminal running!

### Terminal 2: Start the Web Frontend

Open a **NEW** PowerShell window:

```powershell
cd "d:\.SLIIT\RP 2\web"
npm run dev
```

**You should see:**
```
  VITE v5.1.0  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

✅ Your browser should open automatically!
✅ If not, manually open: http://localhost:5173

---

## 🧪 Testing the Application

### Test Flow:

1. **Add Item Screen**
   - Enter Your ID: `FOUNDER001`
   - Select Category: `Electronics`
   - Enter Description: `Found a black smartphone with cracked screen near library`
   - Click: `Generate Verification Questions`
   
2. **Select Questions Screen**
   - Check 2-3 questions you want to answer
   - Click: `Continue to Answer`

3. **Answer Questions Screen**
   - Type answers in each text field
   - Click: `Save Item`

4. **Success Screen**
   - See item details and ID
   - Click: `Report Another Item` to test again

---

## 📁 Project Structure

```
d:\.SLIIT\RP 2\
├── web/                                    # React Web Application
│   ├── src/
│   │   ├── screens/                       # UI Screens
│   │   │   ├── AddItemScreen.jsx         # Step 1: Add item
│   │   │   ├── SelectQuestionsScreen.jsx # Step 2: Select questions
│   │   │   ├── AnswerQuestionsScreen.jsx # Step 3: Answer questions
│   │   │   └── SuccessScreen.jsx         # Step 4: Success
│   │   ├── services/
│   │   │   └── apiService.js             # Backend API calls
│   │   ├── styles/                       # CSS files
│   │   ├── App.jsx                       # Main router
│   │   └── main.jsx                      # Entry point
│   ├── package.json                       # Dependencies
│   ├── vite.config.js                    # Build config
│   └── index.html                        # HTML template
├── services/
│   └── ai-question-service/              # Node.js Backend
│       └── src/                          # Backend code
└── mobile/
    └── flutter_app/                      # Flutter Mobile App
```

---

## 🔧 Common Issues & Solutions

### Issue 1: "Cannot find module"
**Solution:**
```powershell
# Delete node_modules and reinstall
cd web
Remove-Item -Recurse -Force node_modules
npm install
```

### Issue 2: "Port 5173 already in use"
**Solution:** Vite will automatically use the next available port (5174, 5175, etc.)
Check the terminal output for the actual URL.

### Issue 3: "Cannot connect to server"
**Solution:**
```powershell
# Check if backend is running
curl http://localhost:3000/health

# If not running, start it:
cd "d:\.SLIIT\RP 2\services\ai-question-service"
npm start
```

### Issue 4: Backend errors
**Solution:**
- Check if `.env` file exists in `services/ai-question-service/`
- Ensure database is set up: `npm run db:setup`
- Check Claude API key is configured

### Issue 5: Browser doesn't open automatically
**Solution:** Manually navigate to: http://localhost:5173

---

## 🎨 Features Included

✅ **Material Design UI** - Modern, clean interface
✅ **Form Validation** - Client-side validation
✅ **Loading States** - Spinner animations
✅ **Error Handling** - User-friendly error messages
✅ **Responsive Design** - Works on different screen sizes
✅ **Navigation** - React Router for smooth transitions
✅ **API Integration** - Full backend connectivity
✅ **Success Feedback** - Confirmation screens

---

## 🔄 Development Workflow

### Making Changes:

1. **Edit any file** in `web/src/`
2. **Save the file**
3. **Changes appear instantly** in browser (hot reload)
4. **No restart needed!**

### Useful Commands:

```powershell
# Development server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Check for errors
npm run lint
```

---

## 📊 API Endpoints Used

The web app uses these backend endpoints:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Check backend status |
| `/api/questions/generate` | POST | Generate AI questions |
| `/api/items/create` | POST | Save item with Q&A |
| `/api/items/:id` | GET | Get item details |

---

## 🌐 Browser DevTools

### Debugging Tips:

1. **Open DevTools:** Press `F12` or `Ctrl+Shift+I`
2. **Console Tab:** See logs and errors
3. **Network Tab:** Monitor API calls
4. **React DevTools:** Install extension for React debugging

### Check API Calls:
1. Open Network tab
2. Perform action in app
3. See request/response details

---

## 📝 Testing Checklist

Before presenting/demo:

- [ ] Backend starts without errors
- [ ] Web app opens in browser
- [ ] Can submit the initial form
- [ ] Questions generate successfully
- [ ] Can select and deselect questions
- [ ] Can navigate back and forth
- [ ] Can submit answers
- [ ] Item saves to database
- [ ] Success screen displays correctly
- [ ] Can report another item

---

## 🚀 Production Deployment

### Build for Production:

```powershell
cd web
npm run build
```

Output goes to `web/dist/` folder.

### Deployment Options:
- **Vercel** - Easiest, free tier available
- **Netlify** - Great for static sites
- **GitHub Pages** - Free hosting
- **AWS S3** - Scalable hosting

---

## 📚 Documentation Files

- `README.md` - Complete documentation
- `QUICK_START.md` - Quick setup guide
- `WEB_APP_SUMMARY.md` - Feature overview
- `SETUP_AND_RUN.md` - This file

---

## 💡 Tips for Presentation

1. **Pre-test everything** before demo
2. **Keep both terminals visible** to show it's running
3. **Use meaningful test data** (realistic descriptions)
4. **Show the generated questions** - highlight AI feature
5. **Point out the success screen** - shows database integration
6. **Mention it's the same backend** as mobile app

---

## 🎯 Next Steps

### For Your Project:

1. ✅ **Demo the web app** - Show it works end-to-end
2. ⏳ **Continue mobile dev** - Implement Flutter app later
3. ⏳ **Add owner verification** - Second user flow
4. ⏳ **Add authentication** - User login system
5. ⏳ **Add notifications** - Email/SMS alerts
6. ⏳ **Add item search** - Find lost items

### Optional Enhancements:

- Image upload functionality
- Location tracking
- Chat between finder and owner
- Admin dashboard
- Analytics and reporting

---

## 🆘 Getting Help

If you encounter issues:

1. Check this guide again
2. Look at error messages carefully
3. Check browser console (F12)
4. Check terminal output
5. Verify backend is running
6. Try restarting both services

---

## ✨ Summary

You now have:
- ✅ A complete React web application
- ✅ Full integration with your backend
- ✅ All screens implemented
- ✅ Professional UI/UX
- ✅ No mobile emulator needed!

**You can now demo your entire Lost & Found system using just a web browser!**

---

**Happy coding! 🚀**
