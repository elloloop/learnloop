import { NextRequest, NextResponse } from 'next/server';
import { verifyIdToken } from '@/lib/auth-server';
import {
  getUser,
  getUsers,
  createUser,
  updateUser,
} from '@/lib/db-helpers-mongo';
import { User, UserRole, ChildAuthMethod, getPrimaryRole } from '@/types';
import { normalizeRoles, hasAnyRole } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await verifyIdToken(idToken);
    if (!decodedToken) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get parent user
    const parentUser = await getUser(decodedToken.uid);
    if (!parentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user can access children (owner, admin, or parent)
    const userRoles = normalizeRoles(parentUser);
    if (!hasAnyRole(userRoles, ['owner', 'admin', 'parent'])) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get children for this parent
    const allUsers = await getUsers();
    const children = allUsers.filter((u) => u.parentId === decodedToken.uid);

    return NextResponse.json({ children });
  } catch (error: any) {
    console.error('Error getting children:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await verifyIdToken(idToken);
    if (!decodedToken) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get parent user
    const parentUser = await getUser(decodedToken.uid);
    if (!parentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user can create children
    const userRoles = normalizeRoles(parentUser);
    if (!hasAnyRole(userRoles, ['owner', 'admin', 'parent'])) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, email, username, authMethod, password } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    // Validate auth method
    const validAuthMethods: ChildAuthMethod[] = [
      'email',
      'username_parent',
      'username_child',
    ];
    if (!validAuthMethods.includes(authMethod)) {
      return NextResponse.json(
        { error: 'Invalid auth method' },
        { status: 400 }
      );
    }

    // Validate based on auth method
    if (authMethod === 'email' && !email) {
      return NextResponse.json(
        { error: 'Email is required for email-based login' },
        { status: 400 }
      );
    }

    if (authMethod !== 'email' && !username) {
      return NextResponse.json(
        { error: 'Username is required for username-based login' },
        { status: 400 }
      );
    }

    if (authMethod === 'username_parent' && (!password || password.length < 6)) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Check for duplicate email or username
    const allUsers = await getUsers();
    if (email) {
      const existingByEmail = allUsers.find(
        (u) => u.email?.toLowerCase() === email.toLowerCase()
      );
      if (existingByEmail) {
        return NextResponse.json(
          { error: 'Email already in use' },
          { status: 400 }
        );
      }
    }
    if (username) {
      const existingByUsername = allUsers.find(
        (u) => u.username?.toLowerCase() === username.toLowerCase()
      );
      if (existingByUsername) {
        return NextResponse.json(
          { error: 'Username already in use' },
          { status: 400 }
        );
      }
    }

    // Generate child user ID
    const childId = authMethod === 'email'
      ? `child_${email.toLowerCase().replace(/[^a-z0-9]/g, '_')}`
      : `child_${username.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

    // Create child user
    await createUser(childId, {
      name,
      email: email?.toLowerCase(),
      username: username?.toLowerCase(),
      role: 'child',
      parentId: decodedToken.uid,
      authMethod,
      passwordSetByParent: authMethod === 'username_parent',
      requirePasswordChange: authMethod === 'username_child',
      status: authMethod === 'email' ? 'pending' : 'active',
    } as any);

    // Update parent's childIds array
    const currentChildIds = parentUser.childIds || [];
    await updateUser(decodedToken.uid, {
      childIds: [...currentChildIds, childId],
    } as any);

    // TODO: If authMethod is 'username_parent', store password hash securely
    // For now, we'll handle this when implementing actual child login

    return NextResponse.json({
      success: true,
      childId,
      message:
        authMethod === 'email'
          ? 'Child account created. They can sign up with this email.'
          : authMethod === 'username_child'
          ? 'Child account created. They will set their password on first login.'
          : 'Child account created. They can login with the username and password you set.',
    });
  } catch (error: any) {
    console.error('Error creating child:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

