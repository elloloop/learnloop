import { NextRequest, NextResponse } from 'next/server';
import { verifyIdToken } from '@/lib/auth-server';
import { getUser, createUser, getUsers, deleteUser, updateUser } from '@/lib/db-helpers-mongo';
import { UserRole, getPrimaryRole } from '@/types';
import { normalizeRoles, OWNER_EMAIL } from '@/lib/auth';

/**
 * Default roles for new users who sign up without being pre-added:
 * - 'parent' - they can add their own children
 * - Note: 'student' is NOT added by default - it's added during onboarding
 */
const DEFAULT_NEW_USER_ROLES: UserRole[] = ['parent'];

export async function GET(request: NextRequest) {
  try {
    // Get the authorization token from header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const idToken = authHeader.split('Bearer ')[1];
    
    // Verify the token and get user
    const decodedToken = await verifyIdToken(idToken);
    if (!decodedToken) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userEmail = decodedToken.email;
    const userId = decodedToken.uid;

    // Check if this is the owner email first
    if (userEmail === OWNER_EMAIL) {
      console.log('[API] Owner email detected:', userEmail);
      
      // Check if user exists in MongoDB
      const existingUser = await getUser(userId);
      
      if (existingUser) {
        const roles = normalizeRoles(existingUser);
        // Ensure owner role is present
        if (!roles.includes('owner')) {
          roles.unshift('owner');
          await updateUser(userId, { roles } as any);
        }
        
        return NextResponse.json({ 
          roles,
          primaryRole: 'owner',
          email: userEmail,
          uid: userId,
          name: existingUser.name,
          isStudent: roles.includes('student'),
        });
      }
      
      // Create owner account with owner role
      const ownerRoles: UserRole[] = ['owner'];
      try {
        await createUser(userId, {
          email: userEmail,
          roles: ownerRoles,
          primaryRole: 'owner',
          name: decodedToken.name || userEmail?.split('@')[0] || 'Owner',
          status: 'active',
        } as any);
        console.log('[API] Owner account created');
      } catch (error) {
        console.error('[API] Failed to create owner account:', error);
      }
      
      return NextResponse.json({ 
        roles: ownerRoles,
        primaryRole: 'owner',
        email: userEmail,
        uid: userId,
        isStudent: false,
      });
    }

    // For other users, check MongoDB
    try {
      // First, try to find by Firebase UID
      let existingUser = await getUser(userId);
      
      // If not found, try to find by email (for pending users or children)
      if (!existingUser && userEmail) {
        const allUsers = await getUsers();
        existingUser = allUsers.find(u => u.email?.toLowerCase() === userEmail.toLowerCase()) || null;
        
        // If found by email, update the user ID to Firebase UID
        if (existingUser && existingUser.id !== userId) {
          console.log('[API] Migrating pending user to Firebase UID:', existingUser.email);
          try {
            const oldUserId = existingUser.id;
            const roles = normalizeRoles(existingUser);
            
            // Create new record with Firebase UID, preserving all existing data
            await createUser(userId, {
              email: userEmail,
              roles,
              primaryRole: getPrimaryRole(roles),
              name: existingUser.name || decodedToken.name || userEmail?.split('@')[0] || 'User',
              parentId: existingUser.parentId,
              childIds: existingUser.childIds,
              authMethod: existingUser.authMethod,
              status: 'active',
            } as any);
            
            // Delete old pending record
            await deleteUser(oldUserId);
            
            // Re-fetch the user
            existingUser = await getUser(userId);
            console.log('[API] User migrated successfully');
          } catch (error) {
            console.error('[API] Failed to migrate pending user:', error);
          }
        }
      }
      
      if (existingUser) {
        // Update status to active if it was pending
        if (existingUser.status === 'pending') {
          try {
            await updateUser(userId, { status: 'active' } as any);
          } catch (error) {
            console.error('[API] Failed to update user status:', error);
          }
        }
        
        const roles = normalizeRoles(existingUser);
        const primaryRole = getPrimaryRole(roles);
        
        return NextResponse.json({ 
          roles,
          primaryRole,
          email: userEmail,
          uid: userId,
          parentId: existingUser.parentId,
          name: existingUser.name,
          isStudent: roles.includes('student'),
          studentOnboardedAt: existingUser.studentOnboardedAt,
        });
      }
      
      // User not found - new signup
      // Create with default roles (parent by default, no student until onboarding)
      console.log('[API] Creating new user with roles:', DEFAULT_NEW_USER_ROLES);
      try {
        await createUser(userId, {
          email: userEmail,
          roles: DEFAULT_NEW_USER_ROLES,
          primaryRole: getPrimaryRole(DEFAULT_NEW_USER_ROLES),
          name: decodedToken.name || userEmail?.split('@')[0] || 'User',
          status: 'active',
        } as any);
      } catch (error) {
        console.error('[API] Failed to create user record:', error);
      }
      
      return NextResponse.json({ 
        roles: DEFAULT_NEW_USER_ROLES,
        primaryRole: getPrimaryRole(DEFAULT_NEW_USER_ROLES),
        email: userEmail,
        uid: userId,
        isStudent: false,
      });
    } catch (error: any) {
      console.error('[API] Error fetching user role:', error);
      // Fallback if MongoDB fails
      return NextResponse.json({ 
        roles: DEFAULT_NEW_USER_ROLES,
        primaryRole: getPrimaryRole(DEFAULT_NEW_USER_ROLES),
        email: userEmail,
        uid: userId,
        isStudent: false,
      });
    }
  } catch (error: any) {
    console.error('Error getting user role:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get user role' },
      { status: 500 }
    );
  }
}
