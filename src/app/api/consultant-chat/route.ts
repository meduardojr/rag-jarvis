import { sql } from '@/db';
import { NextRequest, NextResponse } from 'next/server';
import { generateEmbedding } from '@/lib/embeddings';

const TYPESAFE_API_KEY = process.env.TYPESAFE_API_KEY;
const SCOPE_CLASSIFICATION_THRESHOLD = 0.85;

// Out-of-scope message for consultant mode
const OUT_OF_SCOPE_MESSAGE =
  'This assistant only helps with software, architecture, tooling, and questions about the author\'s technical work. Please ask a question related to those topics.';

// General advice system prompt for ungrounded path
const GENERAL_ADVICE_SYSTEM_PROMPT =
  'You are a helpful technical consultant. Provide general advice on software development, architecture, tooling, and deployment. Explain trade-offs and best practices. If asked about the author\'s specific stack or projects, note that the information isn\'t in the knowledge base.';

// Helper function to call OpenAI API
async function callOpenAI(model: string, systemPrompt: string, userPrompt: string): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
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
          const tagsArray = row.tags.split(',').map((t: string) => t.trim());
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

// Jev scope classification for consultant mode
async function classifyQuestionWithJev(question: string): Promise<{
  isRelevant: boolean;
  noulProbability: number | null;
  decision: boolean | null;
  latencyMs: number;
}> {
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
      is_relevant_topic: {
        type: 'noul',
        instructions:
          'Is this question asking for advice, explanation, comparison, or help about software development, architecture, tooling, deployment, or the author\'s own technical skills, projects, and experience?',
        criteria: {
          true:
            'The question is about software development, architecture, tooling, deployment, or the author\'s own technical work and experience.',
          false:
            'The question is unrelated to those, e.g. general trivia, small talk, politics, or other non-technical topics.',
        },
      },
    },
  };

  const jevStart = Date.now();
  const jevResponse = await fetch('https://api.typesafe.ai/v1/systemone', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TYPESAFE_API_KEY}`,
    },
    body: JSON.stringify(requestPayload),
  });

  const jevLatencyMs = Date.now() - jevStart;

  if (!jevResponse.ok) {
    throw new Error(`Jev API error: ${jevResponse.status}`);
  }

  const jevData = await jevResponse.json();
  const noulProbability = jevData.answers.is_relevant_topic.noul;
  const isRelevant = noulProbability >= SCOPE_CLASSIFICATION_THRESHOLD;

  return {
    isRelevant,
    noulProbability,
    decision: isRelevant,
    latencyMs: jevLatencyMs,
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

    // Step 1: Classify the question using Jev (sole classification method)
    let isInScope = false;
    let jevNoulProbability: number | null = null;
    let jevDecision: boolean | null = null;
    let jevLatencyMs: number | null = null;

    try {
      const classification = await classifyQuestionWithJev(question);
      jevNoulProbability = classification.noulProbability;
      jevDecision = classification.decision;
      jevLatencyMs = classification.latencyMs;
      isInScope = classification.isRelevant;
    } catch (classificationError) {
      jevLatencyMs = Date.now() - 0; // fallback
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
        grounded: false,
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

    const relevantChunks = similarChunks.filter(
      (chunk: any) => chunk.similarity > 0.5
    );

    let answer: string;
    let grounded = false;
    let sources: string[] | undefined = undefined;

    if (relevantChunks.length === 0) {
      // Ungrounded path: call LLM with general advice prompt and no context
      try {
        answer = await callOpenAI(
          'gpt-3.5-turbo',
          GENERAL_ADVICE_SYSTEM_PROMPT,
          `Question: ${question}`
        );
        // Prepend the notice constant
        const notice = 'Note: this topic isn\'t covered in your knowledge base, so this is general advice, not based on your documented stack.';
        answer = notice + ' ' + answer;
        grounded = false;
      } catch (generationError) {
        console.error('Error generating general advice:', generationError);
        answer =
          'Note: this topic isn\'t covered in your knowledge base, so this is general advice, not based on your documented stack. I encountered an error while trying to generate general advice. Please try again.';
        grounded = false;
      }
    } else {
      // Grounded path: use relevant chunks
      grounded = true;

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

      // De-duplicated list of source entry titles
      const dedupedSources = [
        ...new Set(processedChunks.map((c) => c.title).filter(Boolean)),
      ];

      sources = isOwner ? dedupedSources : undefined;

      const context = processedChunks.map((chunk) =>
        `[From: ${chunk.title}]\n${chunk.cleanedText}`
      ).join('\n\n---\n\n');

      // Consultant persona system prompt
      const consultantSystemPrompt =
        'You are a helpful technical consultant. Advise on technical decisions and answer questions about the author\'s experience. Treat the provided context as the primary source. Prefer the author\'s documented stack and conventions. Explain trade-offs. Clearly state which parts the context does and does not cover. Follow any redaction instructions for visitors.';

      let baseSystemPrompt = consultantSystemPrompt;
      if (!isOwner && allRedactionInstructions.length > 0) {
        const uniqueInstructions = [...new Set(allRedactionInstructions)];
        const redactionPrompt = `You must follow these redaction instructions: ${uniqueInstructions.join('; ')}.`;
        baseSystemPrompt = `${baseSystemPrompt} ${redactionPrompt}`;
      }

      try {
        answer = await callOpenAI(
          'gpt-3.5-turbo',
          baseSystemPrompt,
          `Context:\n${context}\n\nQuestion: ${question}`
        );
      } catch (generationError) {
        console.error('Error generating answer:', generationError);
        answer =
          'Note: this topic isn\'t covered in your knowledge base, so this is general advice, not based on your documented stack. I encountered an error while trying to generate an answer. Please try again.';
        grounded = false;
        sources = undefined;
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
      grounded,
      sources,
    });
  } catch (error) {
    console.error('Error in consultant-chat:', error);
    return NextResponse.json(
      { error: 'Failed to process question' },
      { status: 500 }
    );
  }
}