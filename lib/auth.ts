// Auth helpers with role-based access control
// Updated for multiple roles per user

import { UserRole, ROLE_HIERARCHY, getPrimaryRole, getUserPermissions } from '@/types';

// Owner email from environment variable - set NEXT_PUBLIC_OWNER_EMAIL in .env.local
const OWNER_EMAIL = process.env.NEXT_PUBLIC_OWNER_EMAIL || '';

export { OWNER_EMAIL };

/**
 * Check if user has a specific role
 */
export const hasRole = (roles: UserRole[], role: UserRole): boolean => {
  return roles.includes(role);
};

/**
 * Check if user has any of the specified roles
 */
export const hasAnyRole = (roles: UserRole[], requiredRoles: UserRole[]): boolean => {
  return requiredRoles.some(role => roles.includes(role));
};

/**
 * Check if user has all of the specified roles
 */
export const hasAllRoles = (roles: UserRole[], requiredRoles: UserRole[]): boolean => {
  return requiredRoles.every(role => roles.includes(role));
};

// Check if user can access admin portal
export const canAccessAdmin = (roles: UserRole[]): boolean => {
  return hasAnyRole(roles, ['owner', 'admin']);
};

// Check if user can access reviewer portal
export const canAccessReviewer = (roles: UserRole[]): boolean => {
  return hasAnyRole(roles, ['owner', 'admin', 'reviewer']);
};

// Check if user can access parent portal
export const canAccessParent = (roles: UserRole[]): boolean => {
  return hasAnyRole(roles, ['owner', 'admin', 'parent']);
};

// Check if user can access student/practice portal
// Requires 'student' role - added during onboarding
export const canAccessStudent = (roles: UserRole[]): boolean => {
  return hasRole(roles, 'student');
};

// Check if user is a student (has completed onboarding)
export const isStudent = (roles: UserRole[]): boolean => {
  return hasRole(roles, 'student');
};

// Check if user can delete another user
export const canDeleteUser = (
  deleterRoles: UserRole[],
  targetRoles: UserRole[],
  targetEmail?: string
): boolean => {
  const deleterPrimary = getPrimaryRole(deleterRoles);
  const targetPrimary = getPrimaryRole(targetRoles);
  
  // Owner can delete anyone except themselves (by email check)
  if (deleterPrimary === 'owner') {
    return targetEmail !== OWNER_EMAIL;
  }
  
  // Admins can delete anyone except owner and other admins
  if (deleterPrimary === 'admin') {
    return targetPrimary !== 'owner' && targetPrimary !== 'admin';
  }
  
  // Parents can delete their own children (handled separately with parentId check)
  // But for general permission, parent cannot delete others
  if (hasRole(deleterRoles, 'parent')) {
    return false; // Parent-child deletion handled in specific parent functions
  }
  
  // Others cannot delete anyone
  return false;
};

// Check if user can modify another user's roles
export const canModifyUserRoles = (
  modifierRoles: UserRole[],
  targetRoles: UserRole[],
  newRoles: UserRole[]
): boolean => {
  const modifierPrimary = getPrimaryRole(modifierRoles);
  const targetPrimary = getPrimaryRole(targetRoles);
  
  // Owner can do anything
  if (modifierPrimary === 'owner') {
    return true;
  }
  
  // Admins can modify anyone except owner
  if (modifierPrimary === 'admin') {
    if (targetPrimary === 'owner') {
      return false;
    }
    // Admins cannot grant owner role
    return !newRoles.includes('owner');
  }
  
  // Parents can only modify their children's settings (handled separately)
  return false;
};

// Check if user can create another user with specific roles
export const canCreateUserWithRoles = (
  creatorRoles: UserRole[],
  newUserRoles: UserRole[]
): boolean => {
  const creatorPrimary = getPrimaryRole(creatorRoles);
  
  // Owner can create any role
  if (creatorPrimary === 'owner') {
    return true;
  }
  
  // Admin can create any role except owner
  if (creatorPrimary === 'admin') {
    return !newUserRoles.includes('owner');
  }
  
  // Parent can only create children
  if (hasRole(creatorRoles, 'parent')) {
    // Parents can only create users with 'child' role
    // They might also include 'student' if the child should practice
    const allowedRoles: UserRole[] = ['child', 'student'];
    return newUserRoles.every(role => allowedRoles.includes(role));
  }
  
  // Others cannot create users
  return false;
};

// Get roles that a user can assign to others
export const getAssignableRoles = (userRoles: UserRole[]): UserRole[] => {
  const primary = getPrimaryRole(userRoles);
  
  if (primary === 'owner') {
    return ['owner', 'admin', 'reviewer', 'parent', 'child', 'student'];
  }
  if (primary === 'admin') {
    return ['admin', 'reviewer', 'parent', 'child', 'student'];
  }
  if (hasRole(userRoles, 'parent')) {
    return ['child', 'student'];
  }
  return [];
};

/**
 * Add a role to user's roles array
 */
export const addRole = (currentRoles: UserRole[], newRole: UserRole): UserRole[] => {
  if (currentRoles.includes(newRole)) {
    return currentRoles;
  }
  return [...currentRoles, newRole];
};

/**
 * Remove a role from user's roles array
 */
export const removeRole = (currentRoles: UserRole[], roleToRemove: UserRole): UserRole[] => {
  return currentRoles.filter(role => role !== roleToRemove);
};

/**
 * Normalize roles array from legacy single role format
 */
export const normalizeRoles = (user: { role?: UserRole; roles?: UserRole[] }): UserRole[] => {
  // If roles array exists, use it
  if (user.roles && Array.isArray(user.roles) && user.roles.length > 0) {
    return user.roles;
  }
  
  // Otherwise, convert from legacy single role
  if (user.role) {
    return [user.role];
  }
  
  // Default to empty array (user hasn't onboarded)
  return [];
};
