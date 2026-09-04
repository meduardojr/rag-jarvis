import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { hashPassword, verifyPassword, createSession } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 });
    }

    // Check if password is already set
    const storedHash = await sql`SELECT id, password_hash FROM app_settings LIMIT 1`;

    if (storedHash.length > 0) {
      // Password is set, verify it
      const isValid = await verifyPassword(password, storedHash[0].password_hash);
      if (!isValid) {
        return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
      }
    } else {
      // No password set yet, create one
      // First, check if the app_settings table has any rows at all
      const countResult = await sql`SELECT COUNT(*) as count FROM app_settings`;
      if (Number(countResult[0].count) === 0) {
        // Insert with explicit nextval for the sequence
        const hashedPassword = await hashPassword(password);
        await sql`INSERT INTO app_settings (id, password_hash) VALUES (nextval('app_settings_id_seq'), ${hashedPassword})`;
      } else {
        // Update the existing row (assuming there's only one row)
        const hashedPassword = await hashPassword(password);
        await sql`UPDATE app_settings SET password_hash = ${hashedPassword}, updated_at = CURRENT_TIMESTAMP`;
      }
    }

    // Create a session
    const sessionToken = createSession(1);

    // Set the session cookie
    const response = NextResponse.json({ success: true });
    response.cookies.set('jarvis-session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 60, // 30 minutes
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Error verifying password:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}