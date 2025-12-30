# Testing Guide

## Issues Fixed

### 1. Auto-Login Issue ✅
**Problem**: App was automatically logging in as student in incognito mode.

**Root Cause**: 
- Home page was setting a demo user when Firebase wasn't configured
- Student page was auto-creating a demo user

**Solution**:
- Removed auto-login logic from home page
- Removed demo user creation from student page
- Now properly shows auth screen when not authenticated
- All pages redirect to home/auth screen when not logged in

### 2. Sign Out Issue ✅
**Problem**: Sign out wasn't working properly.

**Solution**:
- Improved sign out handler with proper error handling
- Forces page reload to clear all cached state
- Clears local state immediately
- Added "Clear Cache" button in development mode

## Playwright Test Suite

### Setup
Playwright is installed and configured. Run tests with:
```bash
npm run test
```

### Test Coverage

#### Authentication Tests (`tests/auth.spec.ts`)
- ✅ Initial state shows auth screen (not auto-login)
- ✅ Sign up form works
- ✅ Sign in form works
- ✅ Social login buttons visible
- ✅ Sign up with email/password
- ✅ Sign in with email/password
- ✅ Error handling for invalid credentials
- ✅ **No auto-login after page reload in incognito** (KEY TEST)
- ⏭️ Sign out (requires being logged in)
- ⏭️ Role-based portal visibility (requires being logged in)

#### Navigation Tests (`tests/navigation.spec.ts`)
- ✅ Protected routes redirect to home when not authenticated
- ✅ Loading states work correctly

### Running Tests

```bash
# Run all tests
npm run test

# Run in UI mode (interactive)
npm run test:ui

# Run in headed mode (see browser)
npm run test:headed

# Run in debug mode
npm run test:debug

# Run specific test file
npm run test tests/auth.spec.ts

# Run specific test
npm run test -- -g "should not auto-login"
```

### View Test Results

```bash
# View HTML report
npx playwright show-report
```

## Test Results

Current test status: **8 passed, 2 skipped**

The key test **"should not auto-login after page reload in incognito"** is **PASSING** ✅

This confirms:
- No auto-login happens in incognito/clean browser state
- Auth screen is shown correctly
- User must explicitly sign in

## Manual Testing Checklist

### Incognito Mode Testing
1. ✅ Open app in incognito mode
2. ✅ Should see auth screen (not logged in)
3. ✅ Reload page - should still see auth screen
4. ✅ Sign in with credentials
5. ✅ Should see home page with portals
6. ✅ Sign out should work
7. ✅ After sign out, should see auth screen again

### Role Testing
1. Sign in as owner email (configured via `NEXT_PUBLIC_OWNER_EMAIL`) → Should be "owner"
2. Sign in as new user → Should be "student"
3. Owner should see all portals
4. Student should only see Student Portal
5. Admin should see Admin, Reviewer, and Student portals

## Continuous Testing

Tests run automatically:
- Before each test: clears cookies and storage
- Uses isolated browser context
- Starts dev server automatically
- Takes screenshots on failure

## Next Steps

1. Add more test cases for:
   - Role-based access control
   - Data store routing (test vs prod)
   - User management flows
   - Question generation flows

2. Set up CI/CD integration:
   - Run tests on every PR
   - Generate test reports
   - Block merges on test failures

