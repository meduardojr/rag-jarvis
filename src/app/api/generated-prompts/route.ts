import { sql } from '@/db';
import { NextRequest, NextResponse } from 'next/server';

// GET - Fetch all generated prompts (history)
export async function GET() {
  try {
    const prompts = await sql`
      SELECT id, user_query, target_tool, model_used, model_tier, retrieved_chunk_ids, generated_output, created_at
      FROM generated_prompts
      ORDER BY created_at DESC
    `;
    return NextResponse.json(prompts);
  } catch (error) {
    console.error('Error fetching generated prompts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch generated prompts' },
      { status: 500 }
    );
  }
}

// POST - Save a new generated prompt to history
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      user_query, 
      target_tool, 
      model_used, 
      model_tier, 
      retrieved_chunk_ids = [], 
      generated_output 
    } = body;

    if (!user_query || !target_tool || !model_used || !model_tier || !generated_output) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const [prompt] = await sql`
      INSERT INTO generated_prompts (user_query, target_tool, model_used, model_tier, retrieved_chunk_ids, generated_output)
      VALUES (${user_query}, ${target_tool}, ${model_used}, ${model_tier}, ${retrieved_chunk_ids}, ${generated_output})
      RETURNING id, user_query, target_tool, model_used, model_tier, retrieved_chunk_ids, generated_output, created_at
    `;

    return NextResponse.json(prompt ?? null, { status: prompt ? 201 : 200 });
  } catch (error) {
    console.error('Error creating generated prompt:', error);
    return NextResponse.json(
      { error: 'Failed to save generated prompt' },
      { status: 500 }
    );
  }
}

// DELETE - Clear all history
export async function DELETE() {
  try {
    await sql`DELETE FROM generated_prompts`;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error clearing history:', error);
    return NextResponse.json(
      { error: 'Failed to clear history' },
      { status: 500 }
    );
  }
}
