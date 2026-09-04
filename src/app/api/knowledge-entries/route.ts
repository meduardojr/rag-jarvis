import { sql } from '@/db';
import { NextRequest, NextResponse } from 'next/server';

// GET - Fetch all knowledge entries
export async function GET() {
  try {
    const entries = await sql`
      SELECT id, title, content, category, tags, source_type, created_at, updated_at
      FROM knowledge_entries
      ORDER BY created_at DESC
    `;
    return NextResponse.json(entries);
  } catch (error) {
    console.error('Error fetching knowledge entries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch knowledge entries' },
      { status: 500 }
    );
  }
}

// POST - Create a new knowledge entry with automatic chunking
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, category, tags = [], source_type = 'manual' } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    // Create the knowledge entry
    const [entry] = await sql`
      INSERT INTO knowledge_entries (title, content, category, tags, source_type)
      VALUES (${title}, ${content}, ${category || 'Stack'}, ${tags}, ${source_type})
      RETURNING id, title, content, category, tags, source_type, created_at, updated_at
    `;

    // Chunk the content (simple fixed-size chunking ~400 tokens)
    const chunks = chunkText(content, 400);
    
    // Generate embeddings and store chunks
    for (let i = 0; i < chunks.length; i++) {
      const embedding = await generateEmbedding(chunks[i]);
      
      await sql`
        INSERT INTO chunks (entry_id, chunk_text, chunk_index, embedding)
        VALUES (${entry.id}, ${chunks[i]}, ${i}, ${embedding}::vector)
      `;
    }

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error('Error creating knowledge entry:', error);
    return NextResponse.json(
      { error: 'Failed to create knowledge entry' },
      { status: 500 }
    );
  }
}

// PUT - Update a knowledge entry
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Entry ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { title, content, category, tags } = body;

    const [entry] = await sql`
      UPDATE knowledge_entries
      SET 
        title = COALESCE(${title}, title),
        content = COALESCE(${content}, content),
        category = COALESCE(${category}, category),
        tags = COALESCE(${tags}, tags)
      WHERE id = ${id}
      RETURNING id, title, content, category, tags, source_type, created_at, updated_at
    `;

    if (!entry) {
      return NextResponse.json(
        { error: 'Entry not found' },
        { status: 404 }
      );
    }

    // Re-chunk and update embeddings if content changed
    if (content) {
      // Delete existing chunks
      await sql`DELETE FROM chunks WHERE entry_id = ${id}`;

      // Re-chunk the content
      const chunks = chunkText(content, 400);
      
      for (let i = 0; i < chunks.length; i++) {
        const embedding = await generateEmbedding(chunks[i]);
        
        await sql`
          INSERT INTO chunks (entry_id, chunk_text, chunk_index, embedding)
          VALUES (${id}, ${chunks[i]}, ${i}, ${embedding}::vector)
        `;
      }
    }

    return NextResponse.json(entry);
  } catch (error) {
    console.error('Error updating knowledge entry:', error);
    return NextResponse.json(
      { error: 'Failed to update knowledge entry' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a knowledge entry
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Entry ID is required' },
        { status: 400 }
      );
    }

    await sql`DELETE FROM knowledge_entries WHERE id = ${id}`;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting knowledge entry:', error);
    return NextResponse.json(
      { error: 'Failed to delete knowledge entry' },
      { status: 500 }
    );
  }
}

// Helper function to chunk text
function chunkText(text: string, maxTokens: number): string[] {
  // Rough estimate: 1 token ≈ 4 characters for English text
  const maxChars = maxTokens * 4;
  const chunks: string[] = [];
  
  // Split by double newlines (paragraphs) first
  const paragraphs = text.split(/\n\n+/);
  let currentChunk = '';
  
  for (const paragraph of paragraphs) {
    if ((currentChunk + paragraph).length > maxChars && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = paragraph;
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
    }
  }
  
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks.length > 0 ? chunks : [text];
}

// Helper function to generate embeddings using OpenAI
async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    console.warn('OpenAI API key not found, using zero embeddings');
    return new Array(1536).fill(0);
  }

  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: text,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    return new Array(1536).fill(0);
  }
}
