import { NextRequest, NextResponse } from 'next/server';
import { verifyIdToken } from '@/lib/auth-server';
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getUser,
} from '@/lib/db-helpers-mongo';
import { User, UserRole, getPrimaryRole } from '@/types';

const ALL_VALID_ROLES: UserRole[] = ['owner', 'admin', 'reviewer', 'parent', 'child', 'student'];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    
    const users = await getUsers(role ? { role } : undefined);
    return NextResponse.json({ users });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await verifyIdToken(idToken);
    if (!decodedToken) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { email, name, roles, role } = body;

    // Support both single role (backward compat) and roles array
    let userRoles: UserRole[] = [];
    if (roles && Array.isArray(roles) && roles.length > 0) {
      userRoles = roles;
    } else if (role) {
      userRoles = [role];
    }

    if (!email || userRoles.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: email and at least one role are required' },
        { status: 400 }
      );
    }

    // Validate all roles
    for (const r of userRoles) {
      if (!ALL_VALID_ROLES.includes(r)) {
        return NextResponse.json({ error: `Invalid role: ${r}` }, { status: 400 });
      }
    }

    // Generate a user ID based on email
    const userId = `pending_${email.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

    // Check if user already exists by email
    const allUsers = await getUsers();
    const existingUser = allUsers.find(u => 
      u.email?.toLowerCase() === email.toLowerCase()
    );
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Create user record in MongoDB
    await createUser(userId, {
      email: email.toLowerCase(),
      name: name || email.split('@')[0],
      roles: userRoles,
      role: getPrimaryRole(userRoles), // For backward compatibility
      primaryRole: getPrimaryRole(userRoles),
      status: 'pending',
    } as any);

    return NextResponse.json({ 
      success: true,
      userId,
      message: 'User created successfully. They can sign up with this email to activate their account.'
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, email, name, roles, role } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing user ID' },
        { status: 400 }
      );
    }

    const existingUser = await getUser(userId);
    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const updates: any = {};
    if (email !== undefined) updates.email = email;
    if (name !== undefined) updates.name = name;
    
    // Handle roles update
    if (roles !== undefined && Array.isArray(roles)) {
      // Validate all roles
      for (const r of roles) {
        if (!ALL_VALID_ROLES.includes(r)) {
          return NextResponse.json({ error: `Invalid role: ${r}` }, { status: 400 });
        }
      }
      updates.roles = roles;
      updates.primaryRole = getPrimaryRole(roles);
      updates.role = getPrimaryRole(roles); // For backward compatibility
    } else if (role !== undefined) {
      // Single role update (backward compatibility)
      if (!ALL_VALID_ROLES.includes(role)) {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
      }
      updates.role = role;
      updates.roles = [role];
      updates.primaryRole = role;
    }

    await updateUser(userId, updates);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing user ID' },
        { status: 400 }
      );
    }

    const targetUser = await getUser(userId);
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await deleteUser(userId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
