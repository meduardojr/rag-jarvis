import { sql } from '@/db';
import { NextRequest, NextResponse } from 'next/server';

// POST - Set/change password
export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);

    await sql`
      INSERT INTO app_settings (id, password_hash)
      VALUES (1, ${passwordHash})
      ON CONFLICT (id)
      DO UPDATE SET password_hash = ${passwordHash}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error setting password:', error);
    return NextResponse.json(
      { error: 'Failed to set password' },
      { status: 500 }
    );
  }
}

// GET - Check if password is set
export async function GET() {
  try {
    const result = await sql`
      SELECT password_hash IS NOT NULL as has_password
      FROM app_settings WHERE id = 1
    `;

    return NextResponse.json({ hasPassword: result[0]?.has_password || false });
  } catch (error) {
    console.error('Error checking password:', error);
    return NextResponse.json(
      { error: 'Failed to check password' },
      { status: 500 }
    );
  }
}

// Hash password using bcrypt
async function hashPassword(password: string): Promise<string> {
  const bcrypt = await import('bcryptjs');
  return bcrypt.hash(password, 10);
}
