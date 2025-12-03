# Quick Reference: New Authentication System

## 🎯 Summary of Changes

### Registration
- ✅ **Owner-only registration** (no more role selection)
- ✅ Registration screen simplified
- ✅ All new users automatically get "owner" role

### Found Item Reporting
- ✅ **No login required** - anyone can report found items
- ✅ **Auto-fill feature** - logged-in users get contact details pre-filled
- ✅ Contact fields remain **editable** after auto-fill
- ✅ Green hint shows when fields are auto-filled

### User Roles
- ✅ `owner` - Users who register (search for their lost items)
- ✅ `admin` - System administrators
- ❌ `founder` - **Removed** (anyone can report found items without registering)

---

## 🚀 Quick Start

### For New Users
```bash
# 1. Start the backend
cd Backend
npm run dev

# 2. Start the frontend
cd FindAssure
npm start
```

### Migrate Existing Database
```bash
# If you have existing users with 'founder' role
cd Backend
npm run migrate:founder-to-owner
```

---

## 📋 Testing Scenarios

### ✅ Scenario 1: Guest Reports Found Item
1. Open app (no login)
2. Click "Report a Found Item"
3. Complete the flow
4. ✅ Contact fields are empty - user fills them manually

### ✅ Scenario 2: Logged-In User Reports Found Item
1. Login to account
2. Click "Report a Found Item"
3. Navigate to "Location & Contact" screen
4. ✅ Contact fields auto-filled with user's profile data
5. ✅ Can edit any field if needed
6. Submit successfully

### ✅ Scenario 3: New User Registration
1. Click "Login / Register"
2. Click "Register"
3. ✅ No role selection visible
4. Fill in name, email, phone, password
5. ✅ Account created as "owner" role automatically

### ✅ Scenario 4: Owner Searches Lost Item
1. Must be logged in
2. Click "Find Lost Item"
3. Search and verify ownership
4. ✅ Get founder contact after verification

---

## 🔧 Technical Details

### Modified Files

**Frontend:**
- `src/screens/auth/RegisterScreen.tsx` - Removed role selection
- `src/screens/auth/ProfileScreen.tsx` - Updated role display
- `src/screens/founder/ReportFoundLocationScreen.tsx` - Added auto-fill
- `src/types/models.ts` - Updated interfaces
- `src/context/AuthContext.tsx` - Updated auth logic

**Backend:**
- `src/models/User.ts` - Updated role enum
- `src/controllers/authController.ts` - Fixed role to 'owner'
- `src/scripts/migrateFounderToOwner.ts` - Migration script

**Documentation:**
- `AUTH_SYSTEM_REDESIGN.md` - Complete documentation
- `QUICK_REFERENCE.md` - This file

---

## 🎨 UI Changes

### Before
```
┌─────────────────────────┐
│ Create Account          │
├─────────────────────────┤
│ Name: [________]        │
│ Email: [________]       │
│ Phone: [________]       │
│                         │
│ Role:                   │
│ [Item Owner] [Founder]  │  ← Confusing!
│                         │
│ Password: [________]    │
│                         │
│ [Register]              │
└─────────────────────────┘
```

### After
```
┌─────────────────────────┐
│ Register as Item Owner  │  ← Clear purpose!
├─────────────────────────┤
│ Name: [________]        │
│ Email: [________]       │
│ Phone: [________]       │
│ Password: [________]    │
│                         │
│ [Register]              │
└─────────────────────────┘
```

### Auto-Fill Feature
```
┌─────────────────────────────────────┐
│ 📍 Location Details                 │
│ Location: [Library_________]        │
│                                     │
│ 👤 Your Contact Information         │
│ ✓ Auto-filled from profile          │  ← New hint!
│                                     │
│ Name: [John Doe________]            │  ← Pre-filled
│ Email: [john@example.com_]          │  ← Pre-filled
│ Phone: [+94 77 123 4567__]          │  ← Pre-filled
│                                     │
│ [Submit Found Item]                 │
└─────────────────────────────────────┘
```

---

## 📊 Database Schema

### User Model (Updated)
```typescript
{
  firebaseUid: string;
  name: string;
  email: string;
  phone: string;
  role: 'owner' | 'admin'; // ← 'founder' removed
  createdAt: Date;
  updatedAt: Date;
}
```

### FoundItem Model (Unchanged)
```typescript
{
  imageUrl: string;
  category: string;
  description: string;
  questions: string[];
  founderAnswers: string[];
  founderContact: {          // ← Anyone can provide this
    name: string;
    email: string;
    phone: string;
  };
  location: string;
  status: string;
  createdBy?: ObjectId;      // ← Optional: links to User if logged in
}
```

---

## 🐛 Troubleshooting

### Issue: Existing users can't login
**Solution:** Run the migration script
```bash
cd Backend
npm run migrate:founder-to-owner
```

### Issue: Validation error when creating user
**Solution:** Make sure role is set to 'owner' or 'admin' only

### Issue: Auto-fill not working
**Solution:** 
1. Verify user is logged in
2. Check user profile has name, email, phone
3. Check `useAuth()` hook is properly imported

---

## 📞 Support

If you encounter issues:
1. Check `AUTH_SYSTEM_REDESIGN.md` for detailed documentation
2. Verify all dependencies are installed
3. Run migration script if upgrading from old system
4. Check console logs for detailed error messages

---

## ✨ Benefits

**User Experience:**
- 🎯 Simpler registration flow
- ⚡ Faster found item reporting for logged-in users  
- 🚀 Lower barrier for guests to help
- 🧹 Cleaner, more intuitive interface

**Technical:**
- 🏗️ Cleaner data model
- 🔒 Better separation of concerns
- 📝 Reduced complexity
- 🎭 Optional authentication for found item reporting

---

**Last Updated:** December 2, 2025
**Version:** 2.0
**Status:** ✅ Fully Implemented
