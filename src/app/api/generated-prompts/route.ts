import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const prompts = await sql`
      SELECT id, user_query, target_tool, model_used, model_tier, retrieved_chunk_ids, generated_output, created_at
      FROM generated_prompts
      ORDER BY created_at DESC
    `;
    return NextResponse.json(prompts);
  } catch (error) {
    console.error('Error fetching generated prompts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { user_query, target_tool, model_used, model_tier, retrieved_chunk_ids, generated_output } = await request.json();

    if (!user_query || !generated_output) {
      return NextResponse.json({ error: 'User query and generated output are required' }, { status: 400 });
    }

    const [prompt] = await sql`
      INSERT INTO generated_prompts (user_query, target_tool, model_used, model_tier, retrieved_chunk_ids, generated_output)
      VALUES (${user_query}, ${target_tool}, ${model_used}, ${model_tier}, ${retrieved_chunk_ids}, ${generated_output})
      RETURNING id, user_query, target_tool, model_used, model_tier, retrieved_chunk_ids, generated_output, created_at
    `;

    return NextResponse.json(prompt, { status: 201 });
  } catch (error) {
    console.error('Error adding generated prompt:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await sql`DELETE FROM generated_prompts`;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error clearing generated prompts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}