# Architecture: Next.js Backend API Routes

## Overview

The application now uses **Next.js API routes as a backend layer** instead of calling Firestore directly from the client. This provides better security, centralized logic, and easier maintenance.

## Architecture Flow

### Before (Direct Firestore)
```
Client Component → Firestore SDK (client-side) → Firestore Database
```

### After (API Routes)
```
Client Component → Next.js API Route → Firebase Admin SDK → Firestore Database
```

## API Routes Created

### 1. `/api/auth/user-role` (GET)
- **Purpose**: Get user role from server
- **Auth**: Requires Firebase ID token in Authorization header
- **Returns**: `{ role, email, uid }`
- **Uses**: Firebase Admin SDK to read/write to Firestore

### 2. `/api/auth/update-last-login` (POST)
- **Purpose**: Update user's last login timestamp
- **Auth**: Requires Firebase ID token
- **Uses**: Firebase Admin SDK

## Client-Side Changes

### Updated Files:
1. **`app/page.tsx`** - Uses API route instead of direct Firestore
2. **`app/admin/page.tsx`** - Uses API route for role check
3. **`app/reviewer/page.tsx`** - Uses API route for role check
4. **`app/admin/users/page.tsx`** - Uses API route for role check

### How It Works:
```typescript
// Client gets ID token
const idToken = await firebaseUser.getIdToken();

// Calls API route
const response = await fetch('/api/auth/user-role', {
  headers: {
    'Authorization': `Bearer ${idToken}`,
  },
});

const { role } = await response.json();
```

## Server-Side Setup

### Firebase Admin SDK

The server uses Firebase Admin SDK which requires:

1. **For Production/Deployment:**
   - Uses Application Default Credentials (ADC)
   - Automatically works on Vercel, Google Cloud, etc.

2. **For Local Development:**
   - Option 1: Use service account key (set `FIREBASE_SERVICE_ACCOUNT_KEY` env var)
   - Option 2: Use `gcloud auth application-default login`
   - Option 3: Use Firebase emulator

### Environment Variables

Add to `.env.local` (optional for local dev):
```env
# Optional: Service account key for local development
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'
```

## Benefits

1. **Security**: Firestore rules can be simpler (only Admin SDK needs access)
2. **Centralized Logic**: All auth logic in one place
3. **Better Error Handling**: Server-side error handling
4. **Offline Resilience**: Client doesn't need Firestore connection
5. **Scalability**: Can add caching, rate limiting, etc. in API routes

## Current Status

✅ **Implemented:**
- User role API route
- Update last login API route
- All client pages updated to use API routes
- Firebase Admin SDK setup

⏳ **Still Using Direct Firestore:**
- `lib/db-helpers.ts` - Used by other API routes (this is OK - it's server-side)
- Template/question operations (these are already in API routes)

## Next Steps

1. **Enable Firestore** in Firebase Console (required for API routes to work)
2. **Test authentication flow** - should work even if Firestore is offline initially
3. **Optional**: Set up service account for local development

## Testing

After enabling Firestore:
1. Log in with the owner email (configured via `NEXT_PUBLIC_OWNER_EMAIL`)
2. Should automatically get `owner` role
3. Should redirect to `/admin` portal
4. Check browser console - should see API calls to `/api/auth/user-role`

