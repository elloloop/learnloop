/**
 * API Helpers for extracting user information from requests
 */

import { NextRequest } from 'next/server';
import { auth } from './firebase';
import { getAuth } from 'firebase/auth';

/**
 * Get user email from Firebase ID token in request headers
 * This is used in API routes to determine which data store to use
 */
export async function getUserEmailFromRequest(
  request: NextRequest
): Promise<string | null> {
  try {
    // Try to get token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      // In production, you'd verify this token using Firebase Admin SDK
      // For now, we'll rely on client-side auth state
      // TODO: Implement proper token verification with Firebase Admin SDK
    }

    // Alternative: Get from custom header set by client
    const userEmail = request.headers.get('x-user-email');
    if (userEmail) {
      return userEmail;
    }

    return null;
  } catch (error) {
    console.error('Error getting user email from request:', error);
    return null;
  }
}

/**
 * Get user email from request body (for POST/PUT requests)
 */
export function getUserEmailFromBody(body: any): string | null {
  return body?.userEmail || body?.email || null;
}

