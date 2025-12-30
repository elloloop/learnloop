/**
 * Utility to completely clear authentication state
 * Use this if you're stuck in a logged-in state
 */

'use client';

import { auth } from './firebase';
import { signOut } from 'firebase/auth';

export async function clearAuthState() {
  try {
    // Sign out from Firebase
    if (auth) {
      await signOut(auth);
    }
    
    // Clear any local storage
    if (typeof window !== 'undefined') {
      localStorage.clear();
      sessionStorage.clear();
    }
    
    // Force reload
    window.location.href = '/';
  } catch (error) {
    console.error('Error clearing auth state:', error);
    // Force reload anyway
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  }
}

