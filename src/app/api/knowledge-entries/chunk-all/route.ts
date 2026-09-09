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

// POST /api/knowledge-entries/chunk-all - Bulk chunk all unchunked entries
export async function POST(request: NextRequest) {
  const unauthorized = requireVerifiedSession(request);
  if (unauthorized) return unauthorized;

  const unchunked = await sql`
    SELECT id, content FROM public.knowledge_entries WHERE chunked = false
  `;

  const results = [];
  for (const entry of unchunked) {
    try {
      await sql`DELETE FROM public.chunks WHERE entry_id = ${entry.id}`;
      const chunks = chunkText(entry.content, 400);
      for (let i = 0; i < chunks.length; i++) {
        const embedding = await generateEmbedding(chunks[i]);
        await sql`
          INSERT INTO public.chunks (entry_id, chunk_text, chunk_index, embedding)
          VALUES (${entry.id}, ${chunks[i]}, ${i}, ${embedding}::vector)
        `;
      }
      await sql`UPDATE public.knowledge_entries SET chunked = true WHERE id = ${entry.id}`;
      results.push({ id: entry.id, success: true });
    } catch (error) {
      results.push({ id: entry.id, success: false, error: String(error) });
    }
  }

  return NextResponse.json({ results });
}