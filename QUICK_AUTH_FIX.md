# Quick Fix: Enable Firebase Authentication

## The Problem
Error: `Firebase: Error (auth/operation-not-allowed)`

This means authentication providers are not enabled in Firebase Console.

## Quick Solution (5 minutes)

### Step 1: Open Firebase Console
1. Go to: https://console.firebase.google.com/
2. Select project: **learnloop-3813b**
3. Click **Authentication** in left sidebar
4. Click **Get started** (if first time) or go to **Sign-in method** tab

### Step 2: Enable Email/Password (REQUIRED - Do this first!)
1. Click on **Email/Password** provider
2. Toggle the **Enable** switch to **ON**
3. Click **Save**
4. ✅ This is the minimum needed to test the app

### Step 3: Enable Google Sign-In (Recommended)
1. Click on **Google** provider
2. Toggle **Enable** to **ON**
3. Enter your email as **Project support email**
4. Click **Save**

### Step 4: Enable Other Providers (Optional)
- **GitHub**: Requires OAuth app setup
- **Facebook**: Requires Facebook App setup
- **Twitter/X**: Requires Twitter Developer account

## After Enabling

1. **Wait 10-30 seconds** for changes to propagate
2. **Refresh your browser** (hard refresh: Cmd+Shift+R or Ctrl+Shift+R)
3. **Try signing in again**

## Test It

1. Try **Email/Password** sign up:
   - Click "Don't have an account? Sign up"
   - Enter email, password, username
   - Click "Sign Up"

2. Or try **Google Sign-In**:
   - Click "Continue with Google"
   - Select your Google account

## Still Not Working?

1. Check browser console for specific error
2. Make sure you clicked **Save** after enabling each provider
3. Clear browser cache and cookies
4. Try in incognito/private window

## Minimum Setup for Testing

**Just enable Email/Password** - that's enough to test everything!

