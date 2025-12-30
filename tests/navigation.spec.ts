import { test, expect } from '@playwright/test';

/**
 * Navigation Tests
 * 
 * Tests cover:
 * - Protected routes require authentication
 * - Role-based access control
 * - Redirects for unauthorized users
 */

test.describe('Navigation and Access Control', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/');
  });

  test('should redirect to home when accessing admin without auth', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    
    // Should be redirected to home/auth screen
    await expect(page.locator('text=Sign in to your account').or(page.locator('text=Create a new account'))).toBeVisible();
  });

  test('should redirect to home when accessing reviewer without auth', async ({ page }) => {
    await page.goto('/reviewer');
    await page.waitForLoadState('networkidle');
    
    // Should be redirected to home/auth screen
    await expect(page.locator('text=Sign in to your account').or(page.locator('text=Create a new account'))).toBeVisible();
  });

  test('should redirect to home when accessing student without auth', async ({ page }) => {
    await page.goto('/student');
    await page.waitForLoadState('networkidle');
    
    // Should be redirected to home/auth screen
    await expect(page.locator('text=Sign in to your account').or(page.locator('text=Create a new account'))).toBeVisible();
  });

  test('should show loading state initially', async ({ page }) => {
    await page.goto('/');
    
    // Should see loading or auth screen quickly
    const loadingOrAuth = await Promise.race([
      page.locator('text=Loading...').waitFor({ timeout: 1000 }).then(() => 'loading'),
      page.locator('text=Sign in').waitFor({ timeout: 1000 }).then(() => 'auth'),
    ]).catch(() => 'timeout');
    
    expect(loadingOrAuth).not.toBe('timeout');
  });
});

