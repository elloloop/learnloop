/**
 * React hook to get current user email for client components
 * This helps route to the correct data store (test vs prod)
 */

'use client';

import { useState, useEffect } from 'react';
import { auth } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

export function useUserEmail(): string | null {
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!auth) {
      setUserEmail(null);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
      setUserEmail(user?.email || null);
    });

    return () => unsubscribe();
  }, []);

  return userEmail;
}

