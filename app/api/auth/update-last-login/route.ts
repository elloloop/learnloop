import { NextRequest, NextResponse } from 'next/server';
import { verifyIdToken } from '@/lib/auth-server';
import { updateUserLastLogin } from '@/lib/db-helpers-mongo';

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
    
    // Verify the token
    const decodedToken = await verifyIdToken(idToken);
    if (!decodedToken) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Update last login using MongoDB
    await updateUserLastLogin(decodedToken.uid);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating last login:', error);
    // Don't fail if user doesn't exist yet
    return NextResponse.json(
      { error: error.message || 'Failed to update last login' },
      { status: 500 }
    );
  }
}

