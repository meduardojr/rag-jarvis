import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { verifySession, getSessionFromRequest } from '@/lib/auth';
import { getEmbedding } from '@/lib/embeddings';

export async function GET(request: Request) {
  try {
    const knowledgeEntries = await sql`
      SELECT id, title, content, tag, source_type, created_at, updated_at
      FROM knowledge_entries
      ORDER BY created_at DESC
    `;
    return NextResponse.json(knowledgeEntries);
  } catch (error) {
    console.error('Error fetching knowledge entries:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  // Verify password for creating a knowledge entry
  const session = getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { title, content, tag, source_type = 'manual' } = await request.json();

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }

    // Insert the knowledge entry
    const [entry] = await sql`
      INSERT INTO knowledge_entries (title, content, tag, source_type)
      VALUES (${title}, ${content}, ${tag}, ${source_type})
      RETURNING id, title, content, tag, source_type, created_at, updated_at
    `;

    // Now, create chunks and embeddings
    // We'll split the content into chunks of ~400 tokens. For simplicity, we'll split by paragraphs.
    const paragraphs = content.split('\n\n').filter((p: string) => p.trim() !== '');
    let chunkIndex = 0;
    for (const paragraph of paragraphs) {
      try {
        const embedding = await getEmbedding(paragraph);
        await sql`
          INSERT INTO chunks (entry_id, chunk_text, embedding_vector, chunk_index)
          VALUES (${entry.id}, ${paragraph}, ${embedding}, ${chunkIndex})
        `;
        chunkIndex++;
      } catch (embedError) {
        console.error('Error embedding chunk:', embedError);
        // Continue with other chunks
      }
    }

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error('Error creating knowledge entry:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  // Verify password for updating a knowledge entry
  const session = getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id, title, content, tag, source_type } = await request.json();

    if (!id || !title || !content) {
      return NextResponse.json({ error: 'ID, title, and content are required' }, { status: 400 });
    }

    // Update the knowledge entry
    const [entry] = await sql`
      UPDATE knowledge_entries
      SET title = ${title}, content = ${content}, tag = ${tag}, source_type = ${source_type}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING id, title, content, tag, source_type, created_at, updated_at
    `;

    if (!entry) {
      return NextResponse.json({ error: 'Knowledge entry not found' }, { status: 404 });
    }

    // Delete existing chunks for this entry
    await sql`DELETE FROM chunks WHERE entry_id = ${id}`;

    // Create new chunks and embeddings
    const paragraphs = content.split('\n\n').filter((p: string) => p.trim() !== '');
    let chunkIndex = 0;
    for (const paragraph of paragraphs) {
      try {
        const embedding = await getEmbedding(paragraph);
        await sql`
          INSERT INTO chunks (entry_id, chunk_text, embedding_vector, chunk_index)
          VALUES (${id}, ${paragraph}, ${embedding}, ${chunkIndex})
        `;
        chunkIndex++;
      } catch (embedError) {
        console.error('Error embedding chunk:', embedError);
        // Continue with other chunks
      }
    }

    return NextResponse.json(entry);
  } catch (error) {
    console.error('Error updating knowledge entry:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  // Verify password for deleting a knowledge entry
  const session = getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    // Delete the knowledge entry and its chunks
    await sql`DELETE FROM chunks WHERE entry_id = ${id}`;
    const result = await sql`
      DELETE FROM knowledge_entries
      WHERE id = ${id}
      RETURNING id
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Knowledge entry not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting knowledge entry:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}