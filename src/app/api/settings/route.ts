import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const [settings] = await sql`
      SELECT theme
      FROM app_settings
      LIMIT 1
    `;

    if (!settings) {
      // Default theme
      return NextResponse.json({ theme: 'system' });
    }

    return NextResponse.json({ theme: settings.theme });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { theme } = await request.json();

    if (!theme || !['light', 'dark', 'system'].includes(theme)) {
      return NextResponse.json({ error: 'Invalid theme' }, { status: 400 });
    }

    await sql`
      UPDATE app_settings
      SET theme = ${theme}, updated_at = CURRENT_TIMESTAMP
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}