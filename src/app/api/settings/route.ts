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
        ON CONFLICT (id) DO NOTHING
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
      INSERT INTO app_settings (
        id,
        theme,
        default_model,
        session_timeout_minutes,
        auto_pick_threshold,
        min_sample_size
      )
      VALUES (
        1,
        COALESCE(${theme}, 'system'),
        COALESCE(${default_model}, 'gemini-2.0-flash'),
        COALESCE(${session_timeout_minutes}, 30),
        COALESCE(${auto_pick_threshold}, 0.90),
        COALESCE(${min_sample_size}, 5)
      )
      ON CONFLICT (id) DO UPDATE SET
        theme = COALESCE(${theme}, app_settings.theme),
        default_model = COALESCE(${default_model}, app_settings.default_model),
        session_timeout_minutes = COALESCE(${session_timeout_minutes}, app_settings.session_timeout_minutes),
        auto_pick_threshold = COALESCE(${auto_pick_threshold}, app_settings.auto_pick_threshold),
        min_sample_size = COALESCE(${min_sample_size}, app_settings.min_sample_size),
        updated_at = NOW()
      RETURNING theme, default_model, embedding_model, session_timeout_minutes, auto_pick_threshold, min_sample_size
    `;

    return NextResponse.json(settings ?? null);
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
