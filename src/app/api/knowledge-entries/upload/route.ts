import { sql } from '@/db';
import { NextRequest, NextResponse } from 'next/server';
import { chunkText, generateEmbedding } from '@/lib/embeddings';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

function requireVerifiedSession(request: NextRequest) {
  if (request.cookies.get('jarvis-session')?.value === 'verified') return null;

  return NextResponse.json(
    { error: 'Verify your password before changing the knowledge base' },
    { status: 401 }
  );
}

export async function POST(request: NextRequest) {
  const unauthorized = requireVerifiedSession(request);
  if (unauthorized) return unauthorized;

  try {
    // Check if the request is multipart/form-data
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Content-Type must be multipart/form-data' },
        { status: 400 }
      );
    }

    // Parse the form data
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    const fileName = (file as any).name || 'uploaded-file';
    const fileType = file.type;

    // Extract text based on file type
    let extractedText = '';

    if (fileType === 'text/plain' || fileName.endsWith('.md')) {
      // Handle .md files
      extractedText = await file.text();
    } else if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      // Handle .pdf files
      const arrayBuffer = await file.arrayBuffer();
      const pdfData = await pdfParse(arrayBuffer);
      extractedText = pdfData.text;
    } else {
      return NextResponse.json(
        { error: 'Unsupported file type. Only .md and .pdf files are allowed.' },
        { status: 400 }
      );
    }

    if (!extractedText.trim()) {
      return NextResponse.json(
        { error: 'File is empty or could not be parsed' },
        { status: 400 }
      );
    }

    // Generate title from file name (remove extension)
    const title = fileName.replace(/\.(md|pdf)$/i, '');

    // Create the knowledge entry
    const { hasMetadata, hasTags } = await getKnowledgeColumns();
    const [entry] = hasMetadata
      ? await sql`
          INSERT INTO public.knowledge_entries (title, content, category, tags, source_type)
          VALUES (${title}, ${extractedText}, ${'File'}, ${[]}, 'file')
          RETURNING id, title, content, category, tags, source_type, chunked, created_at, updated_at
        `
      : hasTags
        ? await sql`
            INSERT INTO public.knowledge_entries (title, content, tags)
            VALUES (${title}, ${extractedText}, [])
            RETURNING id, title, content, 'Stack' AS category, tags,
              'file' AS source_type, chunked, created_at, updated_at
          `
      : await sql`
            INSERT INTO public.knowledge_entries (title, content)
            VALUES (${title}, ${extractedText})
            RETURNING id, title, content, 'Stack' AS category, ARRAY[]::text[] AS tags,
              'file' AS source_type, chunked, created_at, updated_at
          `;

    if (!entry) {
      return NextResponse.json(null, { status: 200 });
    }

    // Chunk the content (simple fixed-size chunking ~400 tokens)
    let chunkingSucceeded = false;
    let chunkingError = null;
    try {
      const chunks = chunkText(extractedText, 400);
      for (let i = 0; i < chunks.length; i++) {
        const embedding = await generateEmbedding(chunks[i]);
        await sql`
          INSERT INTO public.chunks (entry_id, chunk_text, chunk_index, embedding)
          VALUES (${entry.id}, ${chunks[i]}, ${i}, ${embedding}::vector)
        `;
      }
      chunkingSucceeded = true;
    } catch (chunkError) {
      console.error('Chunking failed for uploaded file', entry.id, chunkError);
      chunkingError = String(chunkError);
      // entry still gets saved — chunked stays false, user can retry
    }

    await sql`
      UPDATE public.knowledge_entries SET chunked = ${chunkingSucceeded} WHERE id = ${entry.id}
    `;

    // Fetch updated entry to return correct chunked value
    const [updatedEntry] = await sql`
      SELECT id, title, content, category, tags, source_type, chunked, created_at, updated_at
      FROM public.knowledge_entries
      WHERE id = ${entry.id}
    `;

    return NextResponse.json({ ...updatedEntry, chunking_error: chunkingError ?? null }, { status: 201 });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}

// Helper function to get knowledge columns (copied from knowledge-entries/route.ts)
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