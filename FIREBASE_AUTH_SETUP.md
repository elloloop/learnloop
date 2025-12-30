# Firebase Authentication Setup Guide

## Error: auth/operation-not-allowed

This error occurs when an authentication provider is not enabled in Firebase Console.

## Steps to Enable Authentication Providers

### 1. Go to Firebase Console
1. Visit: https://console.firebase.google.com/
2. Select your project: **learnloop-3813b**

### 2. Navigate to Authentication
1. Click on **Authentication** in the left sidebar
2. Click on **Get started** (if first time) or go to **Sign-in method** tab

### 3. Enable Each Provider

#### Email/Password Authentication
1. Click on **Email/Password**
2. Toggle **Enable** to ON
3. Optionally enable **Email link (passwordless sign-in)**
4. Click **Save**

#### Google Sign-In
1. Click on **Google**
2. Toggle **Enable** to ON
3. Enter a **Project support email** (your email)
4. Click **Save**

#### X (Twitter) Sign-In
1. Click on **X (formerly Twitter)**
2. Toggle **Enable** to ON
3. You'll need:
   - **API Key** from Twitter Developer Portal
   - **API Secret** from Twitter Developer Portal
4. Get credentials from: https://developer.twitter.com/en/portal/dashboard
5. Enter credentials and click **Save**

#### Facebook Sign-In
1. Click on **Facebook**
2. Toggle **Enable** to ON
3. You'll need:
   - **App ID** from Facebook Developers
   - **App Secret** from Facebook Developers
4. Get credentials from: https://developers.facebook.com/
5. Enter credentials and click **Save**

#### GitHub Sign-In
1. Click on **GitHub**
2. Toggle **Enable** to ON
3. You'll need:
   - **Client ID** from GitHub OAuth Apps
   - **Client Secret** from GitHub OAuth Apps
4. Get credentials from: https://github.com/settings/developers
5. Enter credentials and click **Save**

## Quick Setup (Minimum Required)

For immediate testing, enable at least:

1. **Email/Password** - Easiest, no external setup needed
2. **Google** - Simple, just needs your email

## Testing After Setup

1. Restart your dev server:
   ```bash
   npm run dev
   ```

2. Try signing in with the enabled provider

3. Check browser console for any remaining errors

## Troubleshooting

### If Email/Password still doesn't work:
- Make sure you clicked **Save** after enabling
- Wait a few seconds for changes to propagate
- Clear browser cache and try again

### If Social Auth doesn't work:
- Verify OAuth credentials are correct
- Check that redirect URLs are configured in provider's console
- For localhost, add `http://localhost:3000` to authorized redirect URIs

## Recommended Setup Order

1. **Email/Password** (Required for basic functionality)
2. **Google** (Easiest social auth)
3. **GitHub** (If you have GitHub account)
4. **Facebook/Twitter** (Optional, requires app setup)

