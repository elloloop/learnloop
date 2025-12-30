/**
 * Data Store Router
 * 
 * Routes data to production or test data stores based on user account type.
 * 
 * Rules:
 * - Production accounts (owner email from env) always use production data
 * - Test accounts (e.g., admin@example.com) use test data store
 * - Determined by email domain or explicit test account list
 */

import { OWNER_EMAIL } from './auth';

// Production accounts that always use production data
const PRODUCTION_ACCOUNTS = [
  OWNER_EMAIL,
  // Add other production accounts here
].filter(Boolean); // Filter out empty strings

// Test account email domains (e.g., @example.com, @test.com)
const TEST_EMAIL_DOMAINS = [
  'example.com',
  'test.com',
  'localhost',
  'local',
];

// Explicit test accounts
const TEST_ACCOUNTS = [
  'admin@example.com',
  'reviewer@example.com',
  'student@example.com',
  // Add other test accounts here
];

/**
 * Determine if a user email is a test account
 */
export function isTestAccount(email: string | null | undefined): boolean {
  if (!email) return false;
  
  const normalizedEmail = email.toLowerCase().trim();
  
  // Check if it's a production account (always use prod)
  if (PRODUCTION_ACCOUNTS.includes(normalizedEmail)) {
    return false;
  }
  
  // Check explicit test accounts
  if (TEST_ACCOUNTS.includes(normalizedEmail)) {
    return true;
  }
  
  // Check test email domains
  const emailDomain = normalizedEmail.split('@')[1];
  if (emailDomain && TEST_EMAIL_DOMAINS.includes(emailDomain)) {
    return true;
  }
  
  // Check environment variable override
  if (process.env.NEXT_PUBLIC_USE_TEST_DATA === 'true') {
    return true;
  }
  
  // Default to production
  return false;
}

/**
 * Get the data store identifier (prod or test)
 */
export function getDataStore(userEmail: string | null | undefined): 'prod' | 'test' {
  return isTestAccount(userEmail) ? 'test' : 'prod';
}

/**
 * Get the collection path prefix based on data store type
 * Returns an array of path segments for Firestore collection reference
 */
export function getCollectionPrefix(userEmail: string | null | undefined): string[] {
  const store = getDataStore(userEmail);
  const baseAppId = process.env.NEXT_PUBLIC_APP_ID || 'learnloop-v1';
  
  if (store === 'test') {
    return ['artifacts', `${baseAppId}-test`, 'public', 'data'];
  }
  
  return ['artifacts', baseAppId, 'public', 'data'];
}

/**
 * Get the users collection path (shared or separate)
 * Returns an array of path segments for Firestore collection reference
 */
export function getUsersCollectionPath(userEmail: string | null | undefined): string[] {
  const store = getDataStore(userEmail);
  
  // Users can be shared or separate - let's make them separate for test accounts
  if (store === 'test') {
    return ['users-test'];
  }
  
  return ['users'];
}

/**
 * Log which data store is being used (for debugging)
 */
export function logDataStoreUsage(userEmail: string | null | undefined, operation: string) {
  if (process.env.NODE_ENV === 'development') {
    const store = getDataStore(userEmail);
    console.log(`[DataStore] ${operation} → ${store.toUpperCase()} (${userEmail || 'anonymous'})`);
  }
}

