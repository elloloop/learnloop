# Firestore Setup Guide

## Issue: "Failed to get document because the client is offline"

This error occurs when Firestore database hasn't been created or enabled in your Firebase project.

## Quick Fix

### Option 1: Create Firestore via Firebase Console (Recommended)

1. Go to: https://console.firebase.google.com/project/learnloop-3813b/firestore
2. Click **"Create database"**
3. Choose **"Start in test mode"** (for development)
4. Select a location (choose closest to you)
5. Click **"Enable"**

### Option 2: Create Firestore via Firebase CLI

```bash
# Make sure you're in the project directory
cd /Users/arunsaragadam/projects/learnloop

# Create Firestore database
firebase firestore:databases:create --location=us-central1
```

### Option 3: Use Default Database

If you already have a default database, just make sure it's enabled:
```bash
firebase firestore:databases:list
```

## After Creating Firestore

1. **Wait 1-2 minutes** for the database to initialize
2. **Refresh your browser** (hard refresh: Cmd+Shift+R)
3. **Try logging in again** with the owner email (set via `NEXT_PUBLIC_OWNER_EMAIL`)
4. The owner role should be automatically assigned

## Verify It's Working

After setup, check the console:
- Should see: `[Auth] Owner email detected`
- Should see: `[Auth] Creating owner account in Firestore`
- Should see: `[Auth] Owner account created successfully`
- Should see: `[Auth] User role: owner`

## Security Rules (For Later)

Once Firestore is working, you should set up security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read their own data
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Add more rules for your collections
  }
}
```

## Troubleshooting

### Still Getting Offline Error?

1. Check if Firestore is enabled:
   - Go to Firebase Console > Firestore Database
   - Should see "Cloud Firestore" enabled

2. Check network connection
3. Clear browser cache
4. Try in incognito mode

### Owner Role Not Working?

The code now has a fallback: if Firestore is offline but the email matches `NEXT_PUBLIC_OWNER_EMAIL`, it will still return `owner` role. However, the user document won't be created until Firestore is online.

