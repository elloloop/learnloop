import { NextRequest, NextResponse } from 'next/server';
import { verifyIdToken } from '@/lib/auth-server';
import { getUser, updateUser } from '@/lib/db-helpers-mongo';
import { UserRole } from '@/types';
import { normalizeRoles } from '@/lib/auth';

/**
 * API route to add 'student' role to a user during onboarding
 * This allows users to practice questions
 */
export async function POST(request: NextRequest) {
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

    const userId = decodedToken.uid;

    // Get existing user
    const existingUser = await getUser(userId);
    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get current roles and add 'student' if not present
    const currentRoles = normalizeRoles(existingUser);
    
    if (currentRoles.includes('student')) {
      return NextResponse.json({
        success: true,
        message: 'User already has student role',
        roles: currentRoles,
      });
    }

    // Add student role
    const updatedRoles: UserRole[] = [...currentRoles, 'student'];
    
    await updateUser(userId, {
      roles: updatedRoles,
      studentOnboardedAt: new Date(),
    } as any);

    console.log('[API] Added student role to user:', userId);

    return NextResponse.json({
      success: true,
      message: 'Student role added successfully',
      roles: updatedRoles,
      studentOnboardedAt: new Date(),
    });
  } catch (error: any) {
    console.error('Error adding student role:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add student role' },
      { status: 500 }
    );
  }
}

