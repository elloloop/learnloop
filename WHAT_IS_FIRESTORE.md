# What is Firestore and How to Enable It

## What is Firestore?

**Firestore** (Cloud Firestore) is Google's NoSQL cloud database service. It's like a database where you can store and retrieve data for your application.

Think of it like:
- **Firebase Authentication** = Handles user login/signup
- **Cloud Firestore** = Stores your app's data (users, templates, questions, etc.)

## Why Do You Need to Enable It?

When you create a Firebase project, **Firestore is not automatically enabled**. You need to explicitly create/enable it because:

1. It's a separate service (you only pay for what you use)
2. You need to choose a database location
3. You need to set initial security rules

## What Does "Enable Firestore" Mean?

"Enabling Firestore" means:
1. **Creating the database** in your Firebase project
2. **Choosing a location** (e.g., us-central1, europe-west1)
3. **Setting initial security rules** (test mode or production mode)

## How to Enable Firestore

### Method 1: Firebase Console (Easiest - 2 minutes)

1. **Go to Firebase Console:**
   - Direct link: https://console.firebase.google.com/project/learnloop-3813b/firestore
   - Or: https://console.firebase.google.com → Select "learnloop-3813b" → Click "Firestore Database"

2. **Click "Create database"** button

3. **Choose security rules:**
   - **"Start in test mode"** (Recommended for development)
     - Allows read/write for 30 days
     - Good for testing
   - **"Start in production mode"** (More secure)
     - Requires security rules setup
     - Better for production

4. **Choose a location:**
   - Select closest to you (e.g., `us-central1`, `europe-west1`)
   - **Important**: Location cannot be changed later
   - Click "Enable"

5. **Wait 1-2 minutes** for database to initialize

### Method 2: Firebase CLI

```bash
# Make sure you're in the project directory
cd /Users/arunsaragadam/projects/learnloop

# Create Firestore database
firebase firestore:databases:create --location=us-central1
```

## What Happens After Enabling?

Once Firestore is enabled:

1. ✅ Your app can read/write data
2. ✅ User roles will be stored in Firestore
3. ✅ Templates, questions, etc. will be saved
4. ✅ No more "client is offline" errors

## Current Error Explained

**Error**: `Failed to get document because the client is offline`

**Meaning**: 
- Firestore database doesn't exist yet
- Or Firestore API is not enabled
- The app is trying to read data but there's no database

**Solution**: Enable Firestore using the steps above

## What Gets Stored in Firestore?

After enabling, your app will store:

- **`users` collection**: User accounts with roles
- **`templates` collection**: Question templates
- **`questions` collection**: Generated questions
- **`reviews` collection**: Question reviews
- **`attempts` collection**: Student attempts
- And more...

## Security Rules (After Enabling)

Once Firestore is enabled, you should set up security rules. For now, "test mode" is fine for development.

Later, you'll want production rules like:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    // Add more rules...
  }
}
```

## Quick Check: Is Firestore Enabled?

After enabling, you should see:
- In Firebase Console: "Cloud Firestore" section with your database
- In your app: No more "offline" errors
- Data gets saved when you create users/templates

## Cost

- **Free tier**: 50K reads/day, 20K writes/day, 20K deletes/day
- **After free tier**: Very affordable pricing
- **For development**: Free tier is more than enough

## Summary

**Enabling Firestore = Creating the database for your app**

It's a one-time setup that takes 2 minutes. After that, your app can store and retrieve all its data!

