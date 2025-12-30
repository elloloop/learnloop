// Server-side auth helpers for Next.js API routes

import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { NextRequest } from 'next/server';

let adminApp: App | null = null;
let adminAuth: any = null;
let adminDb: Firestore | null = null;

// Initialize Firebase Admin SDK
function getAdminApp(): App {
  if (adminApp) {
    return adminApp;
  }

  // Check if already initialized
  if (getApps().length > 0) {
    adminApp = getApps()[0];
    return adminApp;
  }

  // Initialize with service account or use default credentials
  try {
    // Try to use Application Default Credentials (works in production)
    adminApp = initializeApp({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });
  } catch (error) {
    // If that fails, try service account key from env
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (serviceAccount) {
      try {
        const key = JSON.parse(serviceAccount);
        adminApp = initializeApp({
          credential: cert(key),
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        });
      } catch (e) {
        console.error('Failed to initialize Firebase Admin:', e);
        throw e;
      }
    } else {
      // Last resort: try default credentials
      adminApp = initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      });
    }
  }

  return adminApp;
}

export function getAdminAuth() {
  if (!adminAuth) {
    const app = getAdminApp();
    adminAuth = getAuth(app);
  }
  return adminAuth;
}

export function getAdminDb() {
  if (!adminDb) {
    const app = getAdminApp();
    adminDb = getFirestore(app);
  }
  return adminDb;
}

// Verify ID token from client
export async function verifyIdToken(idToken: string) {
  try {
    const adminAuth = getAdminAuth();
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error('Error verifying ID token:', error);
    return null;
  }
}

// Get user from request (helper for API routes)
export async function getUserFromRequest(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const idToken = authHeader.split('Bearer ')[1];
  const decodedToken = await verifyIdToken(idToken);
  return decodedToken;
}

