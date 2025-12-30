# Playwright Test Suite

This directory contains end-to-end tests for the LearnLoop application using Playwright.

## Running Tests

### Run all tests
```bash
npm run test
```

### Run tests in UI mode (interactive)
```bash
npm run test:ui
```

### Run tests in headed mode (see browser)
```bash
npm run test:headed
```

### Run tests in debug mode
```bash
npm run test:debug
```

### Run specific test file
```bash
npm run test tests/auth.spec.ts
```

### Run specific test
```bash
npm run test -- -g "should show auth screen"
```

## Test Files

### `auth.spec.ts`
Tests authentication flows:
- Initial state (should show auth screen, not auto-login)
- Sign up with email/password
- Sign in with email/password
- Sign out functionality
- Role assignment
- Social login buttons
- No auto-login in incognito mode

### `navigation.spec.ts`
Tests navigation and access control:
- Protected routes require authentication
- Role-based access control
- Redirects for unauthorized users

## Test Configuration

Tests are configured in `playwright.config.ts`:
- Base URL: `http://localhost:3000`
- Automatically starts dev server before tests
- Uses Chromium browser
- Takes screenshots on failure
- Generates HTML reports

## Viewing Test Results

After running tests, view the HTML report:
```bash
npx playwright show-report
```

## Writing New Tests

1. Create a new test file in `tests/` directory
2. Import test utilities from `@playwright/test`
3. Use `test.describe` to group related tests
4. Use `test.beforeEach` for setup
5. Use `page.goto()` to navigate
6. Use `expect()` for assertions

Example:
```typescript
import { test, expect } from '@playwright/test';

test.describe('My Feature', () => {
  test('should do something', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=Hello')).toBeVisible();
  });
});
```

## Debugging Tests

1. Use `npm run test:debug` to run in debug mode
2. Use `await page.pause()` in your test to pause execution
3. Use `console.log()` to debug
4. Check screenshots in `test-results/` directory
5. View HTML report for detailed failure information

## CI/CD Integration

Tests can be run in CI/CD pipelines. The config automatically:
- Retries failed tests (2 retries in CI)
- Runs in parallel (1 worker in CI)
- Generates reports for artifact storage

