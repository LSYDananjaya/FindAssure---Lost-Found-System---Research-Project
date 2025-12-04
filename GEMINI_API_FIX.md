# 🔧 Gemini API Key Issue - Fix Guide

## ❌ Current Problem

You're getting a **403 Forbidden** error:
```
Method doesn't allow unregistered callers (callers without established identity). 
Please use API Key or other form of API consumer identity to call this API.
```

This means your Gemini API key either:
1. Hasn't been properly enabled for the Generative Language API
2. Has restrictions that prevent server-side usage
3. Needs to be regenerated
4. Is from an old/deprecated version

## ✅ Solution: Get a Valid Gemini API Key

### Step 1: Go to Google AI Studio
Visit: **https://aistudio.google.com/app/apikey**

(Alternative: https://makersuite.google.com/app/apikey)

### Step 2: Sign In
Use your Google account

### Step 3: Create/Check API Key

#### If you have NO API keys:
1. Click **"Create API Key"**
2. Select **"Create API key in new project"**
3. Wait for it to generate
4. Copy the key

#### If you HAVE existing API keys:
1. Check if any are labeled for "Generative AI" or "All APIs"
2. If restricted, click **"⋮ More"** → **"Show restrictions"**
3. Make sure **"Generative Language API"** is enabled
4. If not, create a NEW unrestricted key

### Step 4: Enable the API (IMPORTANT!)

Your API key might exist but the API isn't enabled. Do this:

1. Go to: **https://console.cloud.google.com/**
2. Select your project (or create one)
3. Search for **"Generative Language API"** in the search bar
4. Click **"ENABLE"** if it's not already enabled
5. Wait for it to activate (may take 1-2 minutes)

### Step 5: Update Your .env File

Open `Backend/.env` and update:

```env
GEMINI_API_KEY=YOUR_NEW_API_KEY_HERE
```

**Example:**
```env
GEMINI_API_KEY=AIzaSyBkXXXXXXXXXXXXXXXXXXXXXXX
```

### Step 6: Restart Backend Server

```powershell
# Stop the current server (Ctrl+C if running)
# Then restart
cd Backend
npm run dev
```

### Step 7: Test Again

```powershell
cd Backend
npx ts-node src/scripts/testGemini.ts
```

You should see:
```
✅ API Key found: AIzaSyCGEh...uBi0
✅ Generated 10 questions in 2000ms
✨ Questions appear to be AI-generated!
```

---

## 🔍 Alternative: Check API Key Restrictions

If you want to keep your existing key, check its restrictions:

1. Go to: https://console.cloud.google.com/apis/credentials
2. Find your API key
3. Click on it
4. Under **"API restrictions"**:
   - Select **"Don't restrict key"** (for testing)
   - OR select **"Restrict key"** and add **"Generative Language API"**
5. Under **"Application restrictions"**:
   - Select **"None"** (for testing)
   - OR add your server IP if you want security
6. Click **"SAVE"**
7. Wait 1-2 minutes for changes to propagate

---

## 🧪 Quick Test Command

After updating your API key, test it instantly:

```powershell
cd D:\.SLIIT\Research\Lost_Found\Backend
npx ts-node src/scripts/testGemini.ts
```

Expected output for SUCCESS:
```
🧪 Testing Gemini AI Integration...

1️⃣ Checking API Key Configuration:
✅ API Key found: AIzaSyCGEh...uBi0

2️⃣ Testing Question Generation:

📱 Testing: Electronics - "Black iPhone 13 Pro with a cracked screen protector"
⏳ Generating questions...
✅ Generated 10 questions in 2145ms

Generated Questions:
   1. What is the exact model of your iPhone (e.g., iPhone 13 Pro 256GB)?
   2. Can you describe the crack pattern on the screen protector?
   3. What color is your iPhone?
   ... (AI-generated questions, not fallback)

✨ Questions appear to be AI-generated!
```

Expected output for FALLBACK (API key issue):
```
Error generating questions with Gemini: GoogleGenerativeAIFetchError: [403 Forbidden]
⚠️  WARNING: These appear to be fallback questions, not AI-generated
```

---

## 💡 Pro Tips

1. **Free Tier Limits**: 
   - 60 requests/minute
   - 1,500 requests/day
   - More than enough for development!

2. **API Key Security**:
   - Never commit `.env` to Git (it's in `.gitignore`)
   - Use different keys for dev/production
   - Rotate keys periodically

3. **Fallback System**:
   - Even if Gemini fails, your app will work
   - It will use smart category-based fallback questions
   - Users won't see errors, just standard questions

---

## 📞 Need Help?

If you're still getting 403 errors after:
1. Creating a new API key
2. Enabling the Generative Language API
3. Removing restrictions
4. Waiting 2-3 minutes

Then try:
- Creating a completely new Google Cloud project
- Using a different Google account
- Checking if your region is supported (most are)

---

## ✅ Checklist

- [ ] Visited https://aistudio.google.com/app/apikey
- [ ] Created/checked API key
- [ ] Enabled "Generative Language API" in Google Cloud Console
- [ ] Updated Backend/.env with new key
- [ ] Restarted backend server
- [ ] Ran test script: `npx ts-node src/scripts/testGemini.ts`
- [ ] Saw "AI-generated" questions (not fallback)

Once all checkboxes are done, your AI question generation is working! 🎉
