// Get the default portal URL based on user roles
// Returns the highest privilege portal the user can access

import { UserRole, getPrimaryRole } from '@/types';

export function getDefaultPortal(roles: UserRole[] | UserRole | null): string {
  if (!roles) {
    return '/'; // Go to home for portal selection
  }

  // Normalize to array
  const rolesArray = Array.isArray(roles) ? roles : [roles];
  
  if (rolesArray.length === 0) {
    return '/'; // Go to home for portal selection
  }

  // Get primary (highest privilege) role
  const primaryRole = getPrimaryRole(rolesArray);

  // Redirect to highest privilege portal
  switch (primaryRole) {
    case 'owner':
    case 'admin':
      return '/admin';
    case 'reviewer':
      return '/reviewer';
    case 'parent':
      return '/parent';
    case 'child':
    case 'student':
      return '/student';
    default:
      return '/';
  }
}

