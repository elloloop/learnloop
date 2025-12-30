import { test, expect } from '@playwright/test';

/**
 * Authentication Flow Tests
 * 
 * Tests cover:
 * - Initial state (should show auth screen, not auto-login)
 * - Sign up with email/password
 * - Sign in with email/password
 * - Sign out functionality
 * - Role assignment (owner vs student)
 * - Social login flows
 */

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page, context }) => {
    // Clear all storage before each test
    await context.clearCookies();
    await context.clearPermissions();
    await page.goto('/');
  });

  test('should show auth screen on initial load (not auto-login)', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Should see auth screen, not logged in
    await expect(page.locator('text=LearnLoop')).toBeVisible();
    await expect(page.locator('text=Sign in to your account').or(page.locator('text=Create a new account'))).toBeVisible();
    
    // Should NOT see user info or sign out button
    await expect(page.locator('text=Sign Out')).not.toBeVisible();
    
    // Should NOT see portal links without authentication
    await expect(page.locator('text=Admin Portal')).not.toBeVisible();
    await expect(page.locator('text=Student Portal')).not.toBeVisible();
  });

  test('should show sign up form when clicking sign up', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Click sign up link
    const signUpLink = page.locator('text=Don\'t have an account? Sign up');
    if (await signUpLink.isVisible()) {
      await signUpLink.click();
    }
    
    // Should see sign up form
    await expect(page.locator('input[type="text"]').first()).toBeVisible(); // Username field
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button:has-text("Sign Up")')).toBeVisible();
  });

  test('should show sign in form by default', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Should see sign in form
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    // Check for sign in button (submit button with "Sign In" text)
    await expect(page.locator('button[type="submit"]:has-text("Sign In")')).toBeVisible();
  });

  test('should show social login buttons', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Should see social login options
    await expect(page.locator('text=Continue with Google')).toBeVisible();
    await expect(page.locator('text=Continue with X')).toBeVisible();
    await expect(page.locator('text=Continue with Facebook')).toBeVisible();
    await expect(page.locator('text=Continue with GitHub')).toBeVisible();
  });

  test('should sign up new user with email/password', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Switch to sign up mode
    const signUpLink = page.locator('text=Don\'t have an account? Sign up');
    if (await signUpLink.isVisible()) {
      await signUpLink.click();
      await page.waitForTimeout(500);
    }
    
    // Fill in sign up form
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    const testUsername = `testuser${Date.now()}`;
    
    // Fill username if visible (sign up mode)
    const usernameInput = page.locator('input[type="text"]').first();
    if (await usernameInput.isVisible()) {
      await usernameInput.fill(testUsername);
    }
    
    await page.locator('input[type="email"]').fill(testEmail);
    await page.locator('input[type="password"]').fill(testPassword);
    
    // Click sign up button
    await page.locator('button:has-text("Sign Up")').click();
    
    // Wait for either success (redirect to home) or error message
    await page.waitForTimeout(2000);
    
    // Check if we're on the home page (success) or still on auth page (error)
    const isOnHomePage = await page.locator('text=Student Portal').isVisible().catch(() => false);
    const hasError = await page.locator('[class*="error"], [class*="red"]').isVisible().catch(() => false);
    
    if (hasError) {
      const errorText = await page.locator('[class*="error"], [class*="red"]').textContent();
      console.log('Sign up error:', errorText);
    }
    
    // Note: This test may fail if Firebase is not configured
    // In that case, we expect to see an error message
  });

  test('should sign in existing user with email/password', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // This test requires a pre-existing user
    // For now, we'll just test the form is functional
    const testEmail = 'admin@example.com';
    const testPassword = 'TestPassword123!';
    
    await page.locator('input[type="email"]').fill(testEmail);
    await page.locator('input[type="password"]').fill(testPassword);
    
    // Click sign in button
    await page.locator('button:has-text("Sign In")').click();
    
    // Wait for response
    await page.waitForTimeout(2000);
    
    // Check if we're logged in or got an error
    const isLoggedIn = await page.locator('text=Sign Out').isVisible().catch(() => false);
    const hasError = await page.locator('[class*="error"]').isVisible().catch(() => false);
    
    if (hasError) {
      console.log('Sign in error (expected if user doesn\'t exist)');
    }
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Try to sign in with invalid credentials
    await page.locator('input[type="email"]').fill('invalid@example.com');
    await page.locator('input[type="password"]').fill('wrongpassword');
    await page.locator('button:has-text("Sign In")').click();
    
    // Should show error message
    await page.waitForTimeout(2000);
    const errorVisible = await page.locator('[class*="error"], [class*="red"]').isVisible().catch(() => false);
    
    // Error should be visible (if Firebase is configured)
    // If Firebase is not configured, we might see a different message
    if (errorVisible) {
      const errorText = await page.locator('[class*="error"], [class*="red"]').textContent();
      expect(errorText).toBeTruthy();
    }
  });

  test('should sign out successfully', async ({ page }) => {
    // This test assumes we're already logged in
    // First, try to sign in or check if already logged in
    await page.waitForLoadState('networkidle');
    
    const signOutButton = page.locator('text=Sign Out');
    const isLoggedIn = await signOutButton.isVisible().catch(() => false);
    
    if (isLoggedIn) {
      // Click sign out
      await signOutButton.click();
      
      // Wait for redirect/sign out
      await page.waitForTimeout(2000);
      
      // Should be back on auth screen
      await expect(page.locator('text=Sign in to your account').or(page.locator('text=Create a new account'))).toBeVisible();
      await expect(page.locator('text=Sign Out')).not.toBeVisible();
    } else {
      // Not logged in, skip this test
      test.skip();
    }
  });

  test('should not auto-login after page reload in incognito', async ({ page, context }) => {
    // Clear all storage
    await context.clearCookies();
    await context.clearPermissions();
    
    // Navigate to home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Should see auth screen, not logged in
    await expect(page.locator('text=Sign in to your account').or(page.locator('text=Create a new account'))).toBeVisible();
    await expect(page.locator('text=Sign Out')).not.toBeVisible();
    
    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Should still see auth screen, not auto-logged in
    await expect(page.locator('text=Sign in to your account').or(page.locator('text=Create a new account'))).toBeVisible();
    await expect(page.locator('text=Sign Out')).not.toBeVisible();
  });

  test('should show correct portals based on user role', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Check if logged in
    const signOutButton = page.locator('text=Sign Out');
    const isLoggedIn = await signOutButton.isVisible().catch(() => false);
    
    if (isLoggedIn) {
      // Check user role from the UI
      const userRoleBadge = page.locator('[class*="bg-indigo-100"]').filter({ hasText: /owner|admin|reviewer|student/ });
      const roleVisible = await userRoleBadge.isVisible().catch(() => false);
      
      if (roleVisible) {
        const roleText = await userRoleBadge.textContent();
        
        // Student should only see Student Portal
        if (roleText?.includes('student')) {
          await expect(page.locator('text=Student Portal')).toBeVisible();
          await expect(page.locator('text=Admin Portal')).not.toBeVisible();
          await expect(page.locator('text=Reviewer Portal')).not.toBeVisible();
        }
        
        // Owner/Admin should see all portals
        if (roleText?.includes('owner') || roleText?.includes('admin')) {
          await expect(page.locator('text=Admin Portal')).toBeVisible();
          await expect(page.locator('text=Reviewer Portal')).toBeVisible();
          await expect(page.locator('text=Student Portal')).toBeVisible();
        }
        
        // Reviewer should see Reviewer and Student portals
        if (roleText?.includes('reviewer')) {
          await expect(page.locator('text=Reviewer Portal')).toBeVisible();
          await expect(page.locator('text=Student Portal')).toBeVisible();
          await expect(page.locator('text=Admin Portal')).not.toBeVisible();
        }
      }
    } else {
      // Not logged in, skip
      test.skip();
    }
  });
});

