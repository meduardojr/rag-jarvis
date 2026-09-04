// Embedding generation utilities
// Used by knowledge-entries (for indexing) and chat (for query)

export async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.warn('OpenAI API key not found, using fallback embedding');
    return generateFallbackEmbedding(text);
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
    return generateFallbackEmbedding(text);
  }
}

// Simple hash-based fallback (for development without OpenAI)
function generateFallbackEmbedding(text: string): number[] {
  const embedding = new Array(1536).fill(0);
  for (let i = 0; i < text.length; i++) {
    embedding[i % 1536] += text.charCodeAt(i) / 255;
  }
  return embedding.map(v => v / text.length);
}

// Chunk text into ~400 token pieces (1 token ≈ 4 chars for English)
export function chunkText(text: string, maxTokens: number = 400): string[] {
  const maxChars = maxTokens * 4;
  const chunks: string[] = [];

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
