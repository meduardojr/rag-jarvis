import { sql } from '@/db';
import { NextRequest, NextResponse } from 'next/server';
import { generateEmbedding } from '@/lib/embeddings';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GENERATION_MODEL = 'gpt-3.5-turbo';
const OUT_OF_SCOPE_MESSAGE = "I'm sorry, but I can only answer questions about your own technical stack, skills, past projects, tools, or what you know/do. Please ask a question related to your knowledge base.";
const SCOPE_CLASSIFICATION_THRESHOLD = 0.85;

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

// Helper function to get a summary of the knowledge base categories and tags
async function getKnowledgeBaseSummary(): Promise<string> {
  try {
    const rows = await sql`
      SELECT DISTINCT category, tags
      FROM knowledge_entries
      WHERE category IS NOT NULL OR tags IS NOT NULL
    `;

    const categories = new Set<string>();
    const tagsSet = new Set<string>();

    for (const row of rows) {
      if (row.category) {
        categories.add(row.category);
      }
      if (row.tags) {
        if (Array.isArray(row.tags)) {
          row.tags.forEach((tag: string) => {
            if (tag) tagsSet.add(tag);
          });
        } else if (typeof row.tags === 'string') {
          const tagsArray = row.tags.split(',').map(t => t.trim());
          tagsArray.forEach((tag: string) => {
            if (tag) tagsSet.add(tag);
          });
        }
      }
    }

    const categoriesArray = Array.from(categories).sort();
    const tagsArray = Array.from(tagsSet).sort();

    let summary = 'Categories covered: ';
    summary += categoriesArray.length > 0 ? categoriesArray.join(', ') : 'none';
    summary += '. Tags used: ';
    summary += tagsArray.length > 0 ? tagsArray.join(', ') : 'none';

    return summary;
  } catch (error) {
    console.error('Error getting knowledge base summary:', error);
    return 'Technical stack, skills, past projects, tools, and personal knowledge.';
  }
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

    // Step 1: Classify the question using Jev (sole classification method)
    let isInScope = false;
    let jevNoulProbability: number | null = null;
    let jevDecision: boolean | null = null;
    let jevLatencyMs: number | null = null;

    const jevStart = Date.now();
    try {
      const TYPESAFE_API_KEY = process.env.TYPESAFE_API_KEY;
      if (!TYPESAFE_API_KEY) {
        throw new Error('TYPESAFE_API_KEY is not set');
      }

      const aboutMeSummary = await getKnowledgeBaseSummary();

      const requestPayload = {
        state: {
          user_question: question,
          about_me_summary: aboutMeSummary,
        },
        model: 'jev-latest',
        questions: {
          is_about_skills: {
            type: 'noul',
            instructions: "Is this question asking about the author's own technical stack, skills, past projects, tools, or what they personally know/do?",
            criteria: {
              true: "The question is about the author's personal technical stack, skills, past projects, tools, or what they personally know/do.",
              false: "The question is not about the author's personal technical stack, skills, past projects, tools, or what they personally know/do. It might be about general knowledge, other people, or unrelated topics."
            }
          },
          relevance_score: {
            type: 'score',
            instructions: "How relevant is the question to the author's skills, knowledge, or work?",
            criteria: ["Unrelated", "Loosely related", "Directly about my skills/work"]
          }
        }
      };

      const jevResponse = await fetch('https://api.typesafe.ai/v1/systemone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TYPESAFE_API_KEY}`,
        },
        body: JSON.stringify(requestPayload),
      });

      if (!jevResponse.ok) {
        throw new Error(`Jev API error: ${jevResponse.status}`);
      }

      const jevData = await jevResponse.json();
      jevLatencyMs = Date.now() - jevStart;

      jevNoulProbability = jevData.answers.is_about_skills.noul;
      isInScope = jevNoulProbability >= SCOPE_CLASSIFICATION_THRESHOLD;
      jevDecision = isInScope;
    } catch (classificationError) {
      jevLatencyMs = Date.now() - jevStart;
      console.error('Error classifying question with Jev:', classificationError);
      // If classification fails, we assume out of scope to be safe
      isInScope = false;
    }

    // Step 2: If out of scope, return the fixed message
    if (!isInScope) {
      await sql`
        INSERT INTO public.about_me_chat_log (question, in_scope, answer, is_owner, jev_noul_probability, jev_decision, jev_latency_ms)
        VALUES (${question}, ${false}, ${OUT_OF_SCOPE_MESSAGE}, ${isOwner}, ${jevNoulProbability}, ${jevDecision}, ${jevLatencyMs})
      `;

      return NextResponse.json({
        answer: OUT_OF_SCOPE_MESSAGE,
        in_scope: false,
        is_owner: isOwner,
      });
    }

    // Step 3: In-scope - use RAG to generate an answer
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

    const relevantChunks = similarChunks.filter((chunk: any) => chunk.similarity > 0.5);

    let answer: string;
    if (relevantChunks.length === 0) {
      answer = "I don't have enough information in your knowledge base to answer this question. Consider adding relevant notes about this topic to improve future responses.";
    } else {
      const processedChunks: { cleanedText: string, title: string }[] = [];
      const allRedactionInstructions: string[] = [];

      for (const chunk of relevantChunks) {
        if (isOwner) {
          processedChunks.push({
            cleanedText: chunk.chunk_text,
            title: chunk.title,
          });
        } else {
          const processed = processChunkForVisitor(chunk.chunk_text);
          processedChunks.push({
            cleanedText: processed.cleanedText,
            title: chunk.title,
          });
          allRedactionInstructions.push(...processed.redactionInstructions);
        }
      }

      const context = processedChunks.map((chunk) => 
        `[From: ${chunk.title}]\n${chunk.cleanedText}`
      ).join('\n\n---\n\n');

      let baseSystemPrompt = "You are a helpful assistant that answers questions based on the provided context from the user's knowledge base. Answer the question based only on the context provided. If the context does not contain enough information to answer the question, say that you don't have enough information.";
      if (!isOwner && allRedactionInstructions.length > 0) {
        const uniqueInstructions = [...new Set(allRedactionInstructions)];
        const redactionPrompt = `You must follow these redaction instructions: ${uniqueInstructions.join('; ')}.`;
        baseSystemPrompt = `${baseSystemPrompt} ${redactionPrompt}`;
      }

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

    await sql`
      INSERT INTO public.about_me_chat_log (question, in_scope, answer, is_owner, jev_noul_probability, jev_decision, jev_latency_ms)
      VALUES (${question}, ${true}, ${answer}, ${isOwner}, ${jevNoulProbability}, ${jevDecision}, ${jevLatencyMs})
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