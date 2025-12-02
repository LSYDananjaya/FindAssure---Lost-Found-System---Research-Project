# Authentication System Redesign

## Overview
The authentication system has been redesigned to be more user-friendly by simplifying the role-based registration flow.

## Key Changes

### 1. Registration Simplified - Owner Only
**Previous System:**
- Users could select between "owner" and "founder" roles during registration
- This was confusing as it wasn't clear why someone would register as a "founder"

**New System:**
- Registration is **only for Item Owners**
- All new registrations automatically get the "owner" role
- The role selection UI has been removed from the registration screen
- Registration subtitle now says "Register as an Item Owner"

### 2. Found Item Reporting - No Login Required
**Key Feature:**
- Anyone can report a found item **without logging in**
- This encourages more people to help by removing barriers

**Auto-Fill Feature for Logged-In Users:**
- If a user is logged in when reporting a found item, their contact details are **automatically filled** in the "Founder Contact" fields
- Name, email, and phone are pre-populated from their profile
- Users can still **edit these fields** if needed (e.g., using a different phone number)
- A green hint message shows: "✓ Auto-filled from your profile (you can edit if needed)"

### 3. Updated Data Models

#### Frontend (`src/types/models.ts`)
```typescript
export interface User {
  role: 'owner' | 'admin'; // Removed 'founder'
}

export interface RegisterData {
  // Role parameter removed - always 'owner'
}
```

#### Backend (`src/models/User.ts`)
```typescript
export type UserRole = 'owner' | 'admin'; // Removed 'founder'

// Schema updated to only allow 'owner' and 'admin'
role: {
  type: String,
  enum: ['owner', 'admin'],
  default: 'owner',
}
```

#### Backend (`src/models/FoundItem.ts`)
- No changes needed
- `founderContact` is still stored (anyone can provide this)
- `createdBy` field can optionally link to a User if they were logged in

## User Flows

### Flow 1: Guest Reports Found Item
1. Open app (not logged in)
2. Click "Report a Found Item"
3. Take/upload photo
4. Fill in item details, questions, and answers
5. **Manually enter** their contact information
6. Submit successfully ✅

### Flow 2: Logged-In Owner Reports Found Item
1. Login to account
2. Click "Report a Found Item"
3. Take/upload photo
4. Fill in item details, questions, and answers
5. Contact fields are **auto-filled** from profile
6. Can edit contact fields if desired
7. Submit successfully ✅

### Flow 3: Owner Searches for Lost Item
1. Must be logged in (required for verification)
2. Search for lost items
3. Find matching item
4. Answer video/text questions to verify ownership
5. Get founder contact details after verification ✅

## Files Modified

### Frontend
1. **src/screens/auth/RegisterScreen.tsx**
   - Removed role selection UI
   - Fixed role to 'owner'
   - Updated subtitle

2. **src/screens/auth/ProfileScreen.tsx**
   - Updated role display

3. **src/screens/founder/ReportFoundLocationScreen.tsx**
   - Added `useAuth` hook
   - Auto-fill contact fields from user profile
   - Added auto-fill hint message
   - Fields remain editable

4. **src/types/models.ts**
   - Updated User interface
   - Updated RegisterData interface
   - Removed 'founder' from role types

5. **src/context/AuthContext.tsx**
   - Updated User interface
   - Removed role parameter from signUp
   - Updated type definitions

### Backend
1. **src/models/User.ts**
   - Updated UserRole type (removed 'founder')
   - Updated schema enum
   - Added comments

2. **src/controllers/authController.ts**
   - Fixed role to 'owner' for new registrations
   - Removed role parameter handling in registration
   - Updated validation logic

## Benefits

### User Experience
✅ Simpler registration - no confusing role selection
✅ Faster found item reporting for logged-in users
✅ Lower barrier for guest users to help by reporting found items
✅ Clear purpose: "Register to search for YOUR lost items"

### Technical
✅ Cleaner data model
✅ Reduced complexity in authentication flow
✅ Better separation of concerns
✅ Optional authentication for found item reporting

## Testing Checklist

- [x] Register new account (should only create 'owner' role)
- [x] Login with existing account
- [x] Report found item as guest (manual contact entry)
- [x] Report found item as logged-in user (auto-filled contacts)
- [x] Edit auto-filled contact fields
- [x] View and update profile
- [x] Search for lost items (requires login)
- [x] Admin login still works

## Migration Notes

### Existing Users
- Existing users with 'founder' role will need manual database update:
  ```javascript
  // MongoDB command to update existing founders to owners
  db.users.updateMany(
    { role: 'founder' },
    { $set: { role: 'owner' } }
  )
  ```

### Database Cleanup
- The User model schema will reject any attempts to create 'founder' role users
- Existing 'founder' role users in the database should be migrated or will cause validation errors

## Future Enhancements

1. **Smart Contact Management**
   - Save multiple contact profiles (work phone, personal phone, etc.)
   - Quick select from saved contacts when reporting found items

2. **Anonymous Reporting**
   - Option to report found items with minimal contact (e.g., just email)
   - System manages handover coordination

3. **Verification Badges**
   - Show "Verified User" badge for registered users who report found items
   - Increase trust in the platform
