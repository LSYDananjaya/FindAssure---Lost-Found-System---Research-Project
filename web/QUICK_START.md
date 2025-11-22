# Quick Start Instructions

## Step 1: Install Dependencies

Open PowerShell and run:

```powershell
cd "d:\.SLIIT\RP 2\web"
npm install
```

This will install all required packages (React, React Router, Axios, Vite, etc.).

## Step 2: Start the Backend Service

In a separate PowerShell terminal:

```powershell
cd "d:\.SLIIT\RP 2\services\ai-question-service"
npm start
```

Make sure the backend is running on http://localhost:3000

## Step 3: Start the Web Application

In another PowerShell terminal:

```powershell
cd "d:\.SLIIT\RP 2\web"
npm run dev
```

The app will automatically open at http://localhost:5173

## Testing the Application

1. Fill in the form with:
   - Your ID: `FOUNDER001`
   - Category: Select any (e.g., "Electronics")
   - Description: Type a detailed description (at least 10 characters)

2. Click "Generate Verification Questions" to get AI-generated questions

3. Select the questions you want to answer

4. Provide answers to each selected question

5. Click "Save Item" to store in the database

6. View the success confirmation with item details

## Troubleshooting

### If npm install fails:
```powershell
# Clear npm cache
npm cache clean --force

# Try again
npm install
```

### If backend is not running:
```powershell
# Check backend status
curl http://localhost:3000/health

# If not running, start it:
cd "d:\.SLIIT\RP 2\services\ai-question-service"
npm start
```

### If port 5173 is busy:
Vite will automatically use the next available port (5174, 5175, etc.)

## Making Changes

- Edit files in `src/` directory
- Changes will hot-reload automatically
- No need to restart the dev server

## Current Features

✅ Add item form with validation
✅ AI question generation
✅ Question selection interface  
✅ Answer submission form
✅ Success confirmation screen
✅ Error handling and loading states
✅ Responsive design
✅ API integration with backend

## Project Structure

```
web/
├── src/
│   ├── screens/           # React components for each screen
│   ├── services/          # API service for backend calls
│   ├── styles/            # CSS files for styling
│   ├── App.jsx            # Main router setup
│   └── main.jsx           # React entry point
├── package.json           # Dependencies
├── vite.config.js        # Vite configuration
└── index.html            # HTML template
```
