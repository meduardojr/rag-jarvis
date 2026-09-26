import { sql } from '@/db';
import { NextRequest, NextResponse } from 'next/server';
import { generateEmbedding } from '@/lib/embeddings';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const CLASSIFICATION_MODEL = 'gpt-3.5-turbo';
const GENERATION_MODEL = 'gpt-3.5-turbo';
const OUT_OF_SCOPE_MESSAGE = "I'm sorry, but I can only answer questions about your own technical stack, skills, past projects, tools, or what you know/do. Please ask a question related to your knowledge base.";

// Helper function to call OpenAI API
async function callOpenAI(model: string, systemPrompt: string, userPrompt: string): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || 'Failed to generate response';
}

// Process a chunk's text for visitor mode: extract redaction instructions and return cleaned text
function processChunkForVisitor(chunkText: string): { cleanedText: string, redactionInstructions: string[] } {
  const lines = chunkText.split('\n');
  const cleanedLines: string[] = [];
  const instructions: string[] = [];

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith('REDACTION:')) {
      const instruction = trimmedLine.substring('REDACTION:'.length).trim();
      if (instruction) {
        instructions.push(instruction);
      }
      // Do not add this line to cleanedLines
    } else {
      cleanedLines.push(line);
    }
  }

  return {
    cleanedText: cleanedLines.join('\n'),
    redactionInstructions: instructions,
  };
}

export async function POST(request: NextRequest) {
  try {
    const { question } = await request.json();

    if (!question || typeof question !== 'string') {
      return NextResponse.json(
        { error: 'Question is required and must be a string' },
        { status: 400 }
      );
    }

    // Check if the session is verified (owner) using the same cookie mechanism as elsewhere
    const SESSION_COOKIE = 'jarvis-session';
    const isOwner = request.cookies.get(SESSION_COOKIE)?.value === 'verified';

    // Step 1: Classify the question
    let isInScope = false;
    try {
      const classificationResponse = await callOpenAI(
        CLASSIFICATION_MODEL,
        "Is this question asking about the user's own technical stack, skills, past projects, tools, or what they know/do? Answer strictly yes or no.",
        question
      );
      isInScope = classificationResponse.toLowerCase().includes('yes');
    } catch (classificationError) {
      console.error('Error classifying question:', classificationError);
      // If classification fails, we assume out of scope to be safe
      isInScope = false;
    }

    // Step 2: If out of scope, return the fixed message
    if (!isInScope) {
      // Log the out-of-scope question
      await sql`
        INSERT INTO public.about_me_chat_log (question, in_scope, answer, is_owner)
        VALUES (${question}, ${false}, ${OUT_OF_SCOPE_MESSAGE}, ${isOwner})
      `;

      return NextResponse.json({
        answer: OUT_OF_SCOPE_MESSAGE,
        in_scope: false,
        is_owner: isOwner,
      });
    }

    // Step 3: In-scope - use RAG to generate an answer
    // Generate embedding for the question
    let queryEmbedding: number[] | null = null;
    try {
      queryEmbedding = await generateEmbedding(question);
    } catch (embeddingError) {
      console.error('Error generating embedding:', embeddingError);
      return NextResponse.json(
        { error: 'Failed to generate question embedding' },
        { status: 500 }
      );
    }

    if (!queryEmbedding) {
      return NextResponse.json(
        { error: 'Failed to generate question embedding' },
        { status: 500 }
      );
    }

    // Search for relevant chunks using vector similarity
    const similarChunks = await sql`
      SELECT 
        c.id,
        c.chunk_text,
        c.entry_id,
        ke.title,
        ke.category,
        ke.tags,
        1 - (c.embedding <=> ${queryEmbedding}::vector) as similarity
      FROM chunks c
      JOIN knowledge_entries ke ON c.entry_id = ke.id
      WHERE c.embedding IS NOT NULL
      ORDER BY c.embedding <=> ${queryEmbedding}::vector
      LIMIT 5
    `;

    // Check if we have relevant results (similarity threshold: 0.5)
    const relevantChunks = similarChunks.filter((chunk: any) => chunk.similarity > 0.5);

    let answer: string;
    if (relevantChunks.length === 0) {
      // No relevant chunks found
      answer = "I don't have enough information in your knowledge base to answer this question. Consider adding relevant notes about this topic to improve future responses.";
    } else {
      // Process chunks based on owner/visitor status
      const processedChunks: { cleanedText: string, title: string }[] = [];
      const allRedactionInstructions: string[] = [];

      for (const chunk of relevantChunks) {
        if (isOwner) {
          // Owner: use the full chunk text, ignore redaction
          processedChunks.push({
            cleanedText: chunk.chunk_text,
            title: chunk.title,
          });
        } else {
          // Visitor: extract redaction instructions and clean the text
          const processed = processChunkForVisitor(chunk.chunk_text);
          processedChunks.push({
            cleanedText: processed.cleanedText,
            title: chunk.title,
          });
          allRedactionInstructions.push(...processed.redactionInstructions);
        }
      }

      // Build context from processed chunks
      const context = processedChunks.map((chunk) => 
        `[From: ${chunk.title}]\n${chunk.cleanedText}`
      ).join('\n\n---\n\n');

      // Prepare the system prompt for answer generation
      let baseSystemPrompt = "You are a helpful assistant that answers questions based on the provided context from the user's knowledge base. Answer the question based only on the context provided. If the context does not contain enough information to answer the question, say that you don't have enough information.";
      if (!isOwner && allRedactionInstructions.length > 0) {
        // For visitor mode with redaction instructions, add them to the system prompt
        const uniqueInstructions = [...new Set(allRedactionInstructions)]; // deduplicate
        const redactionPrompt = `You must follow these redaction instructions: ${uniqueInstructions.join('; ')}.`;
        baseSystemPrompt = `${baseSystemPrompt} ${redactionPrompt}`;
      }

      // Generate answer using the LLM
      try {
        answer = await callOpenAI(
          GENERATION_MODEL,
          baseSystemPrompt,
          `Context:\n${context}\n\nQuestion: ${question}`
        );
      } catch (generationError) {
        console.error('Error generating answer:', generationError);
        answer = "I encountered an error while trying to generate an answer. Please try again.";
      }
    }

    // Log the question and answer
    await sql`
      INSERT INTO public.about_me_chat_log (question, in_scope, answer, is_owner)
      VALUES (${question}, ${true}, ${answer}, ${isOwner})
    `;

    return NextResponse.json({
      answer,
      in_scope: true,
      is_owner: isOwner,
    });
  } catch (error) {
    console.error('Error in about-me-chat:', error);
    return NextResponse.json(
      { error: 'Failed to process question' },
      { status: 500 }
    );
  }
}