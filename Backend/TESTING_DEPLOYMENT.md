# Testing & Deployment Guide

## Testing the Backend

### 1. Manual Testing with cURL

#### Health Check
```bash
curl http://localhost:5000/health
```

#### Create Found Item (No Auth Required)
```bash
curl -X POST http://localhost:5000/api/items/found \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://example.com/phone.jpg",
    "category": "Electronics",
    "description": "Black iPhone 14 found",
    "questions": ["What is the wallpaper?", "What case color?"],
    "founderAnswers": ["Mountain", "Black leather"],
    "location": "Library 2nd Floor",
    "founderContact": {
      "name": "John Founder",
      "email": "founder@test.com",
      "phone": "+1234567890"
    }
  }'
```

#### List Found Items
```bash
curl http://localhost:5000/api/items/found
```

### 2. Testing with Postman/Thunder Client

#### Collection Structure:

**FindAssure API Collection**

1. **Auth**
   - GET Get Current User (`/api/auth/me`)
   - PATCH Update Profile (`/api/auth/me`)
   - POST Register Extra Info (`/api/auth/register-extra`)

2. **Items - Found**
   - POST Report Found Item (`/api/items/found`)
   - GET List Found Items (`/api/items/found`)
   - GET Get Found Item by ID (`/api/items/found/:id`)

3. **Items - Lost**
   - POST Report Lost Item (`/api/items/lost`)
   - GET My Lost Reports (`/api/items/lost/me`)

4. **Verification**
   - POST Create Verification (`/api/items/verification`)
   - GET Get Verification (`/api/items/verification/:id`)
   - GET My Verifications (`/api/items/verification/me`)

5. **Admin**
   - GET Dashboard Overview (`/api/admin/overview`)
   - GET All Found Items (`/api/admin/found-items`)
   - PATCH Update Item Status (`/api/admin/found-items/:id`)
   - GET All Users (`/api/admin/users`)
   - PATCH Update User (`/api/admin/users/:id`)
   - GET All Verifications (`/api/admin/verifications`)
   - PUT Evaluate Verification (`/api/admin/verifications/:id/evaluate`)

#### Environment Variables in Postman:
```
base_url: http://localhost:5000/api
auth_token: <your-firebase-id-token>
admin_token: <admin-firebase-id-token>
```

### 3. Creating Test Users

#### Regular User (Owner)
1. Sign up through the mobile app
2. Firebase will create the user
3. Backend will automatically create User document on first API call

#### Admin User
You need to manually promote a user to admin:

**Method 1: MongoDB Compass/Shell**
```javascript
db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { role: "admin" } }
)
```

**Method 2: MongoDB Shell Command**
```bash
mongo findassure
db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { role: "admin" } }
)
```

---

## Deployment

### Option 1: Deploy to Railway

Railway is easy and free for small projects.

1. **Install Railway CLI**
```bash
npm install -g @railway/cli
```

2. **Login to Railway**
```bash
railway login
```

3. **Initialize Project**
```bash
cd Backend
railway init
```

4. **Add MongoDB**
```bash
railway add mongodb
```

5. **Set Environment Variables**
```bash
railway variables set FIREBASE_PROJECT_ID=your-project-id
railway variables set FIREBASE_CLIENT_EMAIL=your-client-email
railway variables set FIREBASE_PRIVATE_KEY="your-private-key"
railway variables set NODE_ENV=production
```

6. **Deploy**
```bash
railway up
```

7. **Get Deployment URL**
```bash
railway open
```

### Option 2: Deploy to Render

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **New +** → **Web Service**
3. Connect your GitHub repository
4. Configure:
   - **Name:** findassure-backend
   - **Environment:** Node
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Plan:** Free

5. Add Environment Variables:
   - `MONGODB_URI`
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY`
   - `NODE_ENV=production`

6. Click **Create Web Service**

### Option 3: Deploy to Heroku

1. **Install Heroku CLI**
```bash
# Download from https://devcenter.heroku.com/articles/heroku-cli
```

2. **Login**
```bash
heroku login
```

3. **Create App**
```bash
cd Backend
heroku create findassure-backend
```

4. **Add MongoDB Atlas**
```bash
# Use MongoDB Atlas connection string
heroku config:set MONGODB_URI="mongodb+srv://..."
```

5. **Set Environment Variables**
```bash
heroku config:set FIREBASE_PROJECT_ID=your-project-id
heroku config:set FIREBASE_CLIENT_EMAIL=your-email
heroku config:set FIREBASE_PRIVATE_KEY="your-key"
heroku config:set NODE_ENV=production
```

6. **Deploy**
```bash
git push heroku main
```

7. **Open App**
```bash
heroku open
```

### Option 4: Deploy to AWS EC2

1. **Launch EC2 Instance**
   - Ubuntu Server 22.04
   - t2.micro (free tier)
   - Configure security group: Allow ports 22, 80, 443, 5000

2. **Connect to Instance**
```bash
ssh -i your-key.pem ubuntu@your-ec2-ip
```

3. **Install Node.js**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

4. **Install MongoDB (Optional, if not using Atlas)**
```bash
# Follow MongoDB installation guide for Ubuntu
```

5. **Clone Repository**
```bash
git clone <your-repo-url>
cd Backend
```

6. **Install Dependencies**
```bash
npm install
```

7. **Create .env File**
```bash
nano .env
# Paste your environment variables
```

8. **Build Project**
```bash
npm run build
```

9. **Install PM2**
```bash
sudo npm install -g pm2
```

10. **Start Server**
```bash
pm2 start dist/server.js --name findassure-backend
pm2 startup
pm2 save
```

11. **Setup Nginx (Optional)**
```bash
sudo apt install nginx
sudo nano /etc/nginx/sites-available/findassure
```

Add:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/findassure /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## Post-Deployment Steps

### 1. Update Frontend API URL

In `FindAssure/src/api/axiosClient.ts`:
```typescript
const BASE_URL = 'https://your-backend-url.com/api';
```

### 2. Test Deployment

```bash
curl https://your-backend-url.com/health
```

### 3. Monitor Logs

**Railway:**
```bash
railway logs
```

**Render:**
- Check logs in dashboard

**Heroku:**
```bash
heroku logs --tail
```

**AWS EC2:**
```bash
pm2 logs findassure-backend
```

### 4. Set Up Monitoring

Consider using:
- **Sentry** for error tracking
- **LogRocket** for session replay
- **Datadog** for performance monitoring
- **UptimeRobot** for uptime monitoring

---

## Production Checklist

- [ ] Environment variables configured
- [ ] MongoDB connection string updated (Atlas for production)
- [ ] Firebase credentials configured
- [ ] CORS configured with frontend URL
- [ ] Error handling tested
- [ ] Admin user created
- [ ] API endpoints tested
- [ ] Frontend connected and tested
- [ ] Logs monitoring set up
- [ ] Backup strategy for MongoDB
- [ ] SSL certificate configured (HTTPS)
- [ ] Rate limiting added (optional)
- [ ] API documentation shared with team

---

## Troubleshooting

### Backend won't start
1. Check environment variables
2. Verify MongoDB connection
3. Check Firebase credentials
4. Review logs for errors

### Cannot connect from frontend
1. Check CORS settings
2. Verify backend URL in frontend
3. Check network/firewall settings
4. Test with cURL first

### Authentication fails
1. Verify Firebase token is valid
2. Check Firebase credentials in backend
3. Ensure user exists in MongoDB
4. Check token expiration

### Database errors
1. Verify MongoDB connection string
2. Check network access in Atlas
3. Ensure database exists
4. Check model schemas

---

## Performance Optimization

### 1. Database Indexing
Already implemented in models for:
- `firebaseUid` (User)
- `category`, `status` (FoundItem)
- `ownerId` (LostRequest)
- `foundItemId`, `ownerId`, `status` (Verification)

### 2. Caching (Future Enhancement)
Consider adding Redis for:
- Session storage
- Frequently accessed data
- Rate limiting

### 3. CDN for Images
Use services like:
- Cloudinary
- AWS S3 + CloudFront
- Firebase Storage

### 4. Load Balancing (Production Scale)
- Use Nginx as reverse proxy
- Deploy multiple instances
- Implement load balancer

---

## Security Best Practices

- ✅ Firebase token verification
- ✅ Role-based access control
- ✅ Input validation
- ✅ Error handling without exposing internals
- ✅ HTTPS in production
- ⚠️ Consider adding rate limiting
- ⚠️ Consider adding request size limits
- ⚠️ Consider adding API key for public endpoints

---

## Next Steps

1. Test all endpoints thoroughly
2. Deploy to production
3. Update mobile app with production URL
4. Create admin user
5. Test end-to-end flow
6. Set up monitoring
7. Document any issues
8. Prepare for presentation/demo

Good luck with your research project! 🚀
