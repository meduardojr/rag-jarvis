import { sql } from '@/db';
import { NextRequest, NextResponse } from 'next/server';

const SESSION_COOKIE = 'jarvis-session';

// GET - Restore an existing password-verified session
export async function GET(request: NextRequest) {
  return NextResponse.json({
    verified: request.cookies.get(SESSION_COOKIE)?.value === 'verified',
  });
}

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

    const settings = await sql`
      SELECT password_hash, session_timeout_minutes FROM app_settings WHERE id = 1
    `;

    if (settings.length === 0 || !settings[0]?.password_hash) {
      return NextResponse.json({ success: false, configured: false });
    }

    const isValid = await verifyPassword(password, settings[0].password_hash as string);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      );
    }

    const sessionTimeout = (settings[0].session_timeout_minutes as number) || 30;
    const expires = new Date(Date.now() + sessionTimeout * 60 * 1000);

    const response = NextResponse.json({ success: true });
    response.cookies.set(SESSION_COOKIE, 'verified', {
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

// DELETE - End the current password-verified session
export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
  return response;
}

// Verify password using bcrypt
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const bcrypt = await import('bcryptjs');
  return bcrypt.compare(password, hash);
}
