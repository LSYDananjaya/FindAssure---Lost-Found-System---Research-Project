# Cloudinary Image Upload Setup Guide

## Overview
The application now uses **Cloudinary** for cloud-based image storage. This ensures images uploaded from mobile devices are accessible from the web interface.

## Why Cloudinary?
- **Multi-user support**: Images stored centrally, not on local devices
- **Web accessibility**: Browser-compatible URLs instead of local file paths
- **Automatic optimization**: Images resized to max 1000x1000px
- **Free tier**: 25 GB storage, 25 GB bandwidth per month

## Setup Steps

### 1. Create Cloudinary Account
1. Go to [https://cloudinary.com/users/register_free](https://cloudinary.com/users/register_free)
2. Sign up with email or Google account
3. Verify your email address
4. Complete the onboarding (skip optional questions)

### 2. Get API Credentials
1. Log in to [https://console.cloudinary.com/](https://console.cloudinary.com/)
2. Go to **Dashboard** (default page after login)
3. Find the **Account Details** section
4. Copy these three values:
   - **Cloud Name** (e.g., `dwxyz123`)
   - **API Key** (e.g., `123456789012345`)
   - **API Secret** (e.g., `abcdefghijklmnopqrstuvwxyz`)

### 3. Update Backend Environment Variables
1. Open `Backend/.env` file
2. Replace the placeholder values:
   ```env
   CLOUDINARY_CLOUD_NAME=dwxyz123
   CLOUDINARY_API_KEY=123456789012345
   CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz
   ```
3. Save the file
4. Restart the backend server if it's running

### 4. Test the Integration
1. Start backend: `cd Backend; npm run dev`
2. Start mobile app: `cd FindAssure; npm start`
3. In mobile app:
   - Open "Report Found Item" flow
   - Take/select a photo
   - Complete all steps
   - Submit the item
4. Verify:
   - Check terminal for "Uploading image to server..." message
   - Check Cloudinary dashboard → Media Library for uploaded image
   - Open web app at `http://localhost:3000`
   - Verify image displays correctly (not emoji placeholder)

## How It Works

### Mobile App Flow
```
User selects image → Local file URI
                    ↓
                 uploadImage()
                    ↓
         FormData multipart upload
                    ↓
            Backend /api/upload/image
                    ↓
          Cloudinary cloud storage
                    ↓
         Returns public HTTPS URL
                    ↓
        Save URL to MongoDB database
```

### Web App Display
```
Dashboard loads items from API
         ↓
   Checks imageUrl format
         ↓
  If starts with "http": Display <img>
  If starts with "file:": Display emoji placeholder
```

## Image Specifications
- **Format**: JPEG, PNG, GIF, WebP
- **Max file size**: 10 MB (enforced by Multer)
- **Auto-resize**: 1000x1000px (maintains aspect ratio)
- **Folder**: `lost-found-items/`
- **Quality**: Auto-optimized by Cloudinary

## Troubleshooting

### Error: "Cloudinary configuration not set"
- Check Backend/.env has all three Cloudinary variables
- Restart backend server after updating .env

### Error: "Image upload failed"
- Check internet connection (both mobile and backend server)
- Verify Cloudinary credentials are correct
- Check Cloudinary dashboard for API usage limits

### Images still showing as emojis on web
- Verify item was submitted AFTER Cloudinary setup
- Check MongoDB document - imageUrl should start with "https://res.cloudinary.com"
- Old items with file:// URIs will still show emojis (expected behavior)

### Upload timeout
- Check file size (max 10 MB)
- Check network connection
- Try with smaller image or better connection

## Security Notes
- **Never commit .env file**: Already in .gitignore
- **API Secret**: Keep confidential, never expose in frontend code
- **Multer memory storage**: Files not saved to disk temporarily
- **CORS**: Backend only accepts requests from configured frontend URLs

## Free Tier Limits (Cloudinary)
- **Storage**: 25 GB
- **Bandwidth**: 25 GB/month
- **Transformations**: 25 credits/month
- **API requests**: Unlimited

For university deployment with many users, monitor usage in Cloudinary dashboard and upgrade if needed.

## Related Files
- Backend setup:
  - `Backend/src/utils/cloudinary.ts` - Upload/delete functions
  - `Backend/src/controllers/uploadController.ts` - API endpoint
  - `Backend/src/routes/uploadRoutes.ts` - Route registration
  - `Backend/.env` - Configuration variables

- Mobile app:
  - `FindAssure/src/api/itemsApi.ts` - uploadImage API function
  - `FindAssure/src/screens/founder/ReportFoundLocationScreen.tsx` - Submit with upload

- Web app:
  - `WebApp/src/pages/Dashboard.tsx` - Display images with fallback
  - `WebApp/src/pages/ItemDetail.tsx` - Display detail images

## Next Steps
1. ✅ Set up Cloudinary credentials
2. ✅ Test mobile app submission with image
3. ✅ Verify image appears on web dashboard
4. Deploy to production server (update BACKEND_URL in mobile app)
5. Distribute to university members

---
**Status**: Setup complete, ready for testing with real Cloudinary credentials
