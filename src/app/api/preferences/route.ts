import { sql } from '@/db';
import { NextRequest, NextResponse } from 'next/server';

// GET - Get preference scores for branching decisions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    if (!category) {
      // Get all preferences
      const allPreferences = await sql`
        SELECT 
          category,
          option_chosen,
          COUNT(*) as count,
          MAX(created_at) as last_chosen
        FROM preference_choices
        GROUP BY category, option_chosen
        ORDER BY category, count DESC
      `;
      return NextResponse.json(allPreferences);
    }

    // Get scores for a specific category
    const scores = await sql`
      SELECT 
        option_chosen,
        COUNT(*) as count,
        MAX(created_at) as last_chosen
      FROM preference_choices
      WHERE category = ${category}
      GROUP BY option_chosen
      ORDER BY count DESC
    `;

    return NextResponse.json(scores);
  } catch (error) {
    console.error('Error fetching preferences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
      { status: 500 }
    );
  }
}

// POST - Log a preference choice
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { category, option_chosen, context_query } = body;

    if (!category || !option_chosen) {
      return NextResponse.json(
        { error: 'Category and option_chosen are required' },
        { status: 400 }
      );
    }

    const [preference] = await sql`
      INSERT INTO preference_choices (category, option_chosen, context_query)
      VALUES (${category}, ${option_chosen}, ${context_query || null})
      RETURNING id, category, option_chosen, context_query, created_at
    `;

    return NextResponse.json(preference, { status: 201 });
  } catch (error) {
    console.error('Error logging preference:', error);
    return NextResponse.json(
      { error: 'Failed to log preference' },
      { status: 500 }
    );
  }
}
