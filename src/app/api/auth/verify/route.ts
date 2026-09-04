import { sql } from '@/db';
import { NextRequest, NextResponse } from 'next/server';

// POST - Verify password and create session
export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }

    // Get the stored password hash from settings
    const settings = await sql`
      SELECT password_hash, session_timeout_minutes FROM app_settings WHERE id = 1
    `;

    if (settings.length === 0 || !settings[0].password_hash) {
      return NextResponse.json(
        { error: 'Password not configured. Please set a password first.' },
        { status: 401 }
      );
    }

    // For development, we'll use a simple comparison
    // In production, use bcrypt for hashing
    const storedHash = settings[0].password_hash;
    const isValid = await verifyPassword(password, storedHash);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      );
    }

    // Create session cookie
    const sessionTimeout = settings[0].session_timeout_minutes || 30;
    const expires = new Date(Date.now() + sessionTimeout * 60 * 1000);
    
    const response = NextResponse.json({ success: true });
    response.cookies.set('jarvis-session', 'verified', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Error verifying password:', error);
    return NextResponse.json(
      { error: 'Password verification failed' },
      { status: 500 }
    );
  }
}

// Helper function to verify password
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  // For development, support plain text comparison
  // TODO: Implement bcrypt verification in production
  if (hash.startsWith("$2")) {
    // Use bcrypt if hash is bcrypt formatted
    const bcrypt = await import("bcryptjs");
    return await bcrypt.compare(password, hash);
  }
  return password === hash;
}
