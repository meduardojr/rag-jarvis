import { sql } from '@/db';
import { NextRequest, NextResponse } from 'next/server';
import { generateEmbedding } from '@/lib/embeddings';

// Reuse the same model helper functions from chat route
function getModelTier(model: string): 'free' | 'paid' {
  const freeModels = ['gemini-2.0-flash', 'gemini-1.5-flash', 'groq-llama', 'groq-mixtral'];
  return freeModels.some(m => model.toLowerCase().includes(m.toLowerCase())) ? 'free' : 'paid';
}

function getModelApiKey(model: string): string | null {
  if (model.includes('gemini')) {
    return process.env.GEMINI_API_KEY || null;
  }
  if (model.includes('claude') || model.includes('anthropic')) {
    return process.env.ANTHROPIC_API_KEY || null;
  }
  if (model.includes('openai') || model.includes('gpt')) {
    return process.env.OPENAI_API_KEY || null;
  }
  if (model.includes('groq')) {
    return process.env.GROQ_API_KEY || null;
  }
  return null;
}

async function callLLM(model: string, systemPrompt: string, userPrompt: string, apiKey: string): Promise<string> {
  if (model.includes('gemini')) {
    return callGemini(model, systemPrompt, userPrompt, apiKey);
  }
  if (model.includes('claude') || model.includes('anthropic')) {
    return callClaude(systemPrompt, userPrompt, apiKey);
  }
  if (model.includes('groq')) {
    return callGroq(systemPrompt, userPrompt, apiKey);
  }
  // Default to Gemini
  return callGemini('gemini-2.0-flash', systemPrompt, userPrompt, apiKey);
}

async function callGemini(model: string, systemPrompt: string, userPrompt: string, apiKey: string): Promise<string> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ parts: [{ text: userPrompt }] }],
        generationConfig: { maxOutputTokens: 4096 },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Failed to generate answer';
}

async function callClaude(systemPrompt: string, userPrompt: string, apiKey: string): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.status}`);
  }

  const data = await response.json();
  return data.content?.[0]?.text || 'Failed to generate answer';
}

async function callGroq(systemPrompt: string, userPrompt: string, apiKey: string): Promise<string> {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
      throw new Error(`Groq API error: ${response.status}`);
    }
  
    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'Failed to generate answer';
  }

// Function to extract redaction note from content
function extractRedactionNote(content: string): string | null {
  const lines = content.split('\\n');
  for (const line of lines) {
    if (line.trim().startsWith('REDACTION:')) {
      return line.substring('REDACTION:'.length).trim();
    }
  }
  return null;
}

// Check if the session is verified (owner)
function isVerifiedSession(request: NextRequest): boolean {
  return request.cookies.get('jarvis-session')?.value === 'verified';
}

// Configurable out-of-scope message
const OUT_OF_SCOPE_MESSAGE = "I'm designed to answer questions about your technical knowledge base, skills, past projects, and what you know/do. Please ask a question related to your own expertise.";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { question, model = 'gemini-2.0-flash' } = body;

    if (!question || typeof question !== 'string') {
      return NextResponse.json(
        { error: 'Question is required and must be a string' },
        { status: 400 }
      );
    }

    // Step 1: Classify if the question is in-scope using a fast/free-tier model
    // We'll use gemini-2.0-flash for classification (fast and free)
    const classificationModel = 'gemini-2.0-flash';
    const classificationApiKey = getModelApiKey(classificationModel);
    if (!classificationApiKey) {
      // If we don't have an API key for classification, we cannot proceed
      return NextResponse.json(
        { error: 'Classification service unavailable' },
        { status: 503 }
      );
    }

    const classificationSystemPrompt = "You are a classifier that determines if a question is asking about the user's own technical stack, skills, past projects, tools, or what they know/do. Answer strictly with 'yes' or 'no'.";
    const classificationUserPrompt = question;

    let classificationResult = '';
    try {
      classificationResult = await callLLM(
        classificationModel,
        classificationSystemPrompt,
        classificationUserPrompt,
        classificationApiKey
      );
    } catch (error) {
      console.error('Classification LLM error:', error);
      return NextResponse.json(
        { error: 'Failed to classify question' },
        { status: 500 }
      );
    }

    const isScope = classificationResult.trim().toLowerCase() === 'yes';

    // Step 2: Check if the user is the owner (verified session)
    const isOwner = isVerifiedSession(request);

    // Step 3: If out-of-scope, return the fixed message and log
    if (!isScope) {
      // Log the out-of-scope question
      await sql`
        INSERT INTO public.about_me_chat_log (question, in_scope, answer, is_owner)
        VALUES (${question}, false, ${OUT_OF_SCOPE_MESSAGE}, ${isOwner})
      `;

      return NextResponse.json({
        answer: OUT_OF_SCOPE_MESSAGE,
        in_scope: false,
        is_owner: isOwner,
      });
    }

    // Step 4: In-scope - proceed with RAG
    // Generate embedding for the question
    const queryEmbedding = await generateEmbedding(question);
    if (!queryEmbedding) {
      return NextResponse.json(
        { error: 'Failed to generate question embedding' },
        { status: 500 }
      );
    }

    // Search for relevant chunks using vector similarity
    // We also fetch the entry content to extract redaction notes
    const similarChunks = await sql`
      SELECT 
        c.id,
        c.chunk_text,
        c.entry_id,
        ke.title,
        ke.content,
        1 - (c.embedding <=> ${queryEmbedding}::vector) as similarity
      FROM chunks c
      JOIN knowledge_entries ke ON c.entry_id = ke.id
      WHERE c.embedding IS NOT NULL
      ORDER BY c.embedding <=> ${queryEmbedding}::vector
      LIMIT 5
    `;

    // Check similarity threshold (same as chat route: 0.5)
    const relevantChunks = similarChunks.filter((chunk: any) => chunk.similarity > 0.5);

    // If no relevant chunks, we can still try to answer? Or treat as out-of-scope? 
    // The requirement says: if in-scope, retrieve relevant chunks and generate answer.
    // If no chunks, we can say we don't have enough information.
    // We'll proceed to generate an answer with empty context, but we can also check and return a message.
    // Let's follow the chat route: if no relevant chunks, we return an out-of-scope-like message? 
    // But note: the question was classified as in-scope, so we should not use the out-of-scope message.
    // We'll generate an answer indicating lack of information.
    if (relevantChunks.length === 0) {
      const noInfoAnswer = "I don't have enough information in your knowledge base to answer this question. Consider adding relevant notes about this topic to improve future answers.";
      await sql`
        INSERT INTO public.about_me_chat_log (question, in_scope, answer, is_owner)
        VALUES (${question}, true, ${noInfoAnswer}, ${isOwner})
      `;
      return NextResponse.json({
        answer: noInfoAnswer,
        in_scope: true,
        is_owner: isOwner,
      });
    }

    // Build context for the LLM, handling redaction notes for visitors
    const contextParts = relevantChunks.map((chunk: any) => {
      const redactionNote = extractRedactionNote(chunk.content);
      let chunkText = chunk.chunk_text;
      if (!isOwner && redactionNote) {
        // For visitors, append the redaction note as instructions
        chunkText += `\n\nRedaction note: ${redactionNote}`;
      }
      return `[From: ${chunk.title}]\n${chunkText}`;
    });

    const context = contextParts.join('\n\n---\n\n');

    // Generate the answer using the selected model
    const answerSystemPrompt = "You are a helpful assistant that answers questions about the user's technical knowledge base. Use only the provided context to answer. If the context does not contain enough information, say that you don't have enough information. Be concise and direct.";
    const answerUserPrompt = `Question: ${question}\n\nContext: ${context}`;

    let answer = '';
    try {
      answer = await callLLM(model, answerSystemPrompt, answerUserPrompt, getModelApiKey(model)!);
    } catch (error) {
      console.error('Answer generation LLM error:', error);
      return NextResponse.json(
        { error: 'Failed to generate answer' },
        { status: 500 }
      );
    }

    // Log the interaction
    await sql`
      INSERT INTO public.about_me_chat_log (question, in_scope, answer, is_owner)
      VALUES (${question}, true, ${answer}, ${isOwner})
    `;

    return NextResponse.json({
      answer,
      in_scope: true,
      is_owner: isOwner,
    });
  } catch (error) {
    console.error('Error in about-me-chat:', error);
    return NextResponse.json(
      { error: 'Failed to process about-me-chat request' },
      { status: 500 }
    );
  }
}