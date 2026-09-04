import { sql } from '@/db';
import { NextRequest, NextResponse } from 'next/server';

// GET - Fetch app settings
export async function GET() {
  try {
    const settings = await sql`
      SELECT 
        theme,
        default_model,
        embedding_model,
        session_timeout_minutes,
        auto_pick_threshold,
        min_sample_size
      FROM app_settings
      WHERE id = 1
    `;

    if (settings.length === 0) {
      // Create default settings if they don't exist
      await sql`
        INSERT INTO app_settings (id, theme, default_model, embedding_model)
        VALUES (1, 'system', 'gemini-2.0-flash', 'text-embedding-3-small')
      `;
      return NextResponse.json({
        theme: 'system',
        default_model: 'gemini-2.0-flash',
        embedding_model: 'text-embedding-3-small',
        session_timeout_minutes: 30,
        auto_pick_threshold: 0.90,
        min_sample_size: 5,
      });
    }

    return NextResponse.json(settings[0]);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// PUT - Update app settings
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { theme, default_model, session_timeout_minutes, auto_pick_threshold, min_sample_size } = body;

    const [settings] = await sql`
      UPDATE app_settings
      SET 
        theme = COALESCE(${theme}, theme),
        default_model = COALESCE(${default_model}, default_model),
        session_timeout_minutes = COALESCE(${session_timeout_minutes}, session_timeout_minutes),
        auto_pick_threshold = COALESCE(${auto_pick_threshold}, auto_pick_threshold),
        min_sample_size = COALESCE(${min_sample_size}, min_sample_size)
      WHERE id = 1
      RETURNING theme, default_model, embedding_model, session_timeout_minutes, auto_pick_threshold, min_sample_size
    `;

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
