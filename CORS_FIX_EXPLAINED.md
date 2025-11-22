# CORS Configuration Fix

## Problem
Your web app was getting this error:
```
Access to XMLHttpRequest at 'http://localhost:3000/api/questions/generate' 
from origin 'http://localhost:5173' has been blocked by CORS policy
```

## Root Cause
The backend's `.env` file was configured to only allow requests from `http://localhost:8080` (Flutter web default port), but your React app runs on `http://localhost:5173` (Vite default port).

## Solution Applied

### 1. Updated `.env` file
Changed:
```env
CORS_ORIGIN=http://localhost:8080
```

To:
```env
CORS_ORIGIN=http://localhost:5173
```

### 2. Enhanced `server.js` CORS configuration
Added support for multiple origins:
```javascript
const allowedOrigins = [
  'http://localhost:5173',  // React web app (Vite)
  'http://localhost:8080',  // Flutter web
  'http://localhost:3000',  // Same origin
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.CORS_ORIGIN === '*') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
```

## What This Means

✅ **React web app (port 5173)** can now make API calls
✅ **Flutter web (port 8080)** can still make API calls
✅ **Mobile apps** can make API calls (no origin check)
✅ Backend has been restarted with new configuration

## Testing

1. Refresh your React web app at `http://localhost:5173`
2. Try submitting the form
3. Questions should now generate successfully!

## Understanding CORS

**CORS (Cross-Origin Resource Sharing)** is a browser security feature that blocks requests from one domain to another unless explicitly allowed.

### Why it happened:
- **Frontend origin:** `http://localhost:5173` (React/Vite)
- **Backend origin:** `http://localhost:3000` (Node.js)
- These are different origins (different ports)
- Browser blocks the request unless backend allows it

### How we fixed it:
- Configured backend to explicitly allow `localhost:5173`
- Backend now sends `Access-Control-Allow-Origin: http://localhost:5173` header
- Browser accepts the response

## Port Reference

| Application | Port | Framework |
|------------|------|-----------|
| Backend API | 3000 | Node.js/Express |
| React Web | 5173 | Vite |
| Flutter Web | 8080 | Flutter |

## For Production

When deploying to production, update `CORS_ORIGIN` in `.env` to your actual domain:

```env
# Development
CORS_ORIGIN=http://localhost:5173

# Production
CORS_ORIGIN=https://your-app-domain.com
```

Or use environment variables:
```javascript
const allowedOrigins = process.env.NODE_ENV === 'production' 
  ? ['https://your-app-domain.com']
  : ['http://localhost:5173', 'http://localhost:8080'];
```

## Common CORS Errors

### Error: "CORS policy: No 'Access-Control-Allow-Origin' header"
**Fix:** Backend needs to include CORS headers

### Error: "Access-Control-Allow-Origin' value that is not equal to supplied origin"
**Fix:** Backend is allowing wrong origin (what we just fixed!)

### Error: "Preflight request doesn't pass access control check"
**Fix:** Backend needs to handle OPTIONS requests (already configured)

## Troubleshooting

If you still see CORS errors:

1. **Hard refresh the browser:** Ctrl + Shift + R
2. **Clear browser cache**
3. **Restart backend:** Stop and run `npm start` again
4. **Check backend logs:** Should show the request coming in
5. **Check browser DevTools Network tab:** Look at request headers

## Next Steps

✅ CORS is now configured correctly
✅ Backend is running with new settings
✅ React app should work now

Try testing your app - it should work perfectly! 🚀
