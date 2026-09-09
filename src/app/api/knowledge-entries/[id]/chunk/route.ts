import { sql } from '@/db';
import { NextRequest, NextResponse } from 'next/server';
import { chunkText, generateEmbedding } from '@/lib/embeddings';

function requireVerifiedSession(request: NextRequest) {
  if (request.cookies.get('jarvis-session')?.value === 'verified') return null;

  return NextResponse.json(
    { error: 'Verify your password before changing the knowledge base' },
    { status: 401 }
  );
}

// POST /api/knowledge-entries/[id]/chunk - Chunk Now action
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = requireVerifiedSession(request);
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const [entry] = await sql`SELECT content FROM public.knowledge_entries WHERE id = ${id}`;
  if (!entry) {
    return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
  }

  try {
    await sql`DELETE FROM public.chunks WHERE entry_id = ${id}`;

    const chunks = chunkText(entry.content, 400);
    for (let i = 0; i < chunks.length; i++) {
      const embedding = await generateEmbedding(chunks[i]);
      await sql`
        INSERT INTO public.chunks (entry_id, chunk_text, chunk_index, embedding)
        VALUES (${id}, ${chunks[i]}, ${i}, ${embedding}::vector)
      `;
    }

    await sql`UPDATE public.knowledge_entries SET is_chunked = true WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Retroactive chunking failed:', error);
    return NextResponse.json({ error: 'Chunking failed' }, { status: 500 });
  }
}