import { sql } from '@/db';
import { NextRequest, NextResponse } from 'next/server';
import { chunkText, generateEmbedding } from '@/lib/embeddings';

async function getKnowledgeColumns() {
  const columns = await sql`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'knowledge_entries'
      AND column_name IN ('category', 'tags', 'source_type')
  `;
  const names = new Set(columns.map((column) => column.column_name));

  return {
    hasMetadata: ['category', 'tags', 'source_type'].every((name) => names.has(name)),
    hasTags: names.has('tags'),
  };
}

// GET - Fetch all knowledge entries
export async function GET() {
  try {
    const { hasMetadata, hasTags } = await getKnowledgeColumns();
    const entries = hasMetadata
      ? await sql`
          SELECT id, title, content, category, tags, source_type, created_at, updated_at
          FROM public.knowledge_entries
          ORDER BY created_at DESC
        `
      : hasTags
        ? await sql`
            SELECT id, title, content, 'Stack' AS category, tags,
              'manual' AS source_type, created_at, updated_at
            FROM public.knowledge_entries
            ORDER BY created_at DESC
          `
        : await sql`
            SELECT id, title, content, 'Stack' AS category, ARRAY[]::text[] AS tags,
              'manual' AS source_type, created_at, updated_at
            FROM public.knowledge_entries
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
    const { title, content, category, source_type = 'manual' } = body;
    const rawTags: unknown[] = Array.isArray(body.tags) ? body.tags : [body.tags];
    const tags = Array.from(new Set(
      rawTags
        .flatMap((tag) => typeof tag === 'string' ? tag.split(',') : [])
        .map((tag) => tag.trim())
        .filter(Boolean)
    ));

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    // Create the knowledge entry. Older schemas may only contain some metadata fields.
    const { hasMetadata, hasTags } = await getKnowledgeColumns();
    const [entry] = hasMetadata
      ? await sql`
          INSERT INTO public.knowledge_entries (title, content, category, tags, source_type)
          VALUES (${title}, ${content}, ${category || 'Stack'}, ${tags}, ${source_type})
          RETURNING id, title, content, category, tags, source_type, created_at, updated_at
        `
      : hasTags
        ? await sql`
            INSERT INTO public.knowledge_entries (title, content, tags)
            VALUES (${title}, ${content}, ${tags})
            RETURNING id, title, content, 'Stack' AS category, tags,
              'manual' AS source_type, created_at, updated_at
          `
        : await sql`
            INSERT INTO public.knowledge_entries (title, content)
            VALUES (${title}, ${content})
            RETURNING id, title, content, 'Stack' AS category, ARRAY[]::text[] AS tags,
              'manual' AS source_type, created_at, updated_at
          `;

    if (!entry) {
      return NextResponse.json(null, { status: 200 });
    }

    // Chunk the content (simple fixed-size chunking ~400 tokens)
    const chunks = chunkText(content, 400);
    
    // Generate embeddings and store chunks
    for (let i = 0; i < chunks.length; i++) {
      const embedding = await generateEmbedding(chunks[i]);
      
      await sql`
        INSERT INTO public.chunks (entry_id, chunk_text, chunk_index, embedding)
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
    const { title, content, category } = body;
    const rawTags: unknown[] = Array.isArray(body.tags) ? body.tags : [body.tags];
    const tags = Array.from(new Set(
      rawTags
        .flatMap((tag) => typeof tag === 'string' ? tag.split(',') : [])
        .map((tag) => tag.trim())
        .filter(Boolean)
    ));

    const { hasMetadata, hasTags } = await getKnowledgeColumns();
    const [entry] = hasMetadata
      ? await sql`
          UPDATE public.knowledge_entries
          SET
            title = COALESCE(${title}, title),
            content = COALESCE(${content}, content),
            category = COALESCE(${category}, category),
            tags = ${tags}
          WHERE id = ${id}
          RETURNING id, title, content, category, tags, source_type, created_at, updated_at
        `
      : hasTags
        ? await sql`
            UPDATE public.knowledge_entries
            SET
              title = COALESCE(${title}, title),
              content = COALESCE(${content}, content),
              tags = ${tags}
            WHERE id = ${id}
            RETURNING id, title, content, 'Stack' AS category, tags,
              'manual' AS source_type, created_at, updated_at
          `
        : await sql`
            UPDATE public.knowledge_entries
            SET
              title = COALESCE(${title}, title),
              content = COALESCE(${content}, content)
            WHERE id = ${id}
            RETURNING id, title, content, 'Stack' AS category, ARRAY[]::text[] AS tags,
              'manual' AS source_type, created_at, updated_at
          `;

    if (!entry) {
      return NextResponse.json(null);
    }

    // Re-chunk and update embeddings if content changed
    if (content) {
      // Delete existing chunks
      await sql`DELETE FROM public.chunks WHERE entry_id = ${id}`;

      // Re-chunk the content
      const chunks = chunkText(content, 400);
      
      for (let i = 0; i < chunks.length; i++) {
        const embedding = await generateEmbedding(chunks[i]);
        
        await sql`
          INSERT INTO public.chunks (entry_id, chunk_text, chunk_index, embedding)
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

    await sql`DELETE FROM public.knowledge_entries WHERE id = ${id}`;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting knowledge entry:', error);
    return NextResponse.json(
      { error: 'Failed to delete knowledge entry' },
      { status: 500 }
    );
  }
}

