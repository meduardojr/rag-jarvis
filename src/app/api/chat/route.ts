import { sql } from '@/db';
import { NextRequest, NextResponse } from 'next/server';
import { generateEmbedding } from '@/lib/embeddings';

// POST - Chat with RAG (generates AI prompts grounded in knowledge base)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      query, 
      target_tool = 'claude',
      model = 'gemini-2.0-flash'
    } = body;

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // Get model tier (free or paid)
    const modelTier = getModelTier(model);

    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query);
    
    if (!queryEmbedding) {
      return NextResponse.json(
        { error: 'Failed to generate query embedding' },
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

    if (relevantChunks.length === 0) {
      // No relevant chunks found - out of scope detection
      return NextResponse.json({
        out_of_scope: true,
        message: "This topic isn't covered in your current knowledge base. Consider adding relevant notes about this stack/preference to improve future prompt generation.",
        suggestion: "Add knowledge about this topic to your knowledge base for better prompt generation.",
      });
    }

    // Build context from retrieved chunks
    const context = relevantChunks.map((chunk: any) => 
      `[From: ${chunk.title}]\n${chunk.chunk_text}`
    ).join('\n\n---\n\n');

    // Generate the prompt using the selected model
    const generatedPrompt = await generatePrompt({
      query,
      context,
      targetTool: target_tool,
      model,
      chunks: relevantChunks,
    });

    // Get the IDs of chunks used
    const chunkIds = relevantChunks.map((chunk: any) => chunk.id);

    // Save to history
    await sql`
      INSERT INTO generated_prompts (user_query, target_tool, model_used, model_tier, retrieved_chunk_ids, generated_output)
      VALUES (${query}, ${target_tool}, ${model}, ${modelTier}, ${chunkIds}, ${generatedPrompt})
    `;

    return NextResponse.json({
      out_of_scope: false,
      generated_prompt: generatedPrompt,
      retrieved_sources: relevantChunks.map((chunk: any) => ({
        id: chunk.id,
        title: chunk.title,
        category: chunk.category,
        similarity: chunk.similarity,
        excerpt: chunk.chunk_text.substring(0, 200) + '...',
      })),
      model_used: model,
      model_tier: modelTier,
      target_tool: target_tool,
    });
  } catch (error) {
    console.error('Error in chat:', error);
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    );
  }
}

// Get model tier based on model name
function getModelTier(model: string): 'free' | 'paid' {
  const freeModels = ['gemini-2.0-flash', 'gemini-1.5-flash', 'groq-llama', 'groq-mixtral'];
  return freeModels.some(m => model.toLowerCase().includes(m.toLowerCase())) ? 'free' : 'paid';
}

// Generate prompt using LLM
async function generatePrompt(params: {
  query: string;
  context: string;
  targetTool: string;
  model: string;
  chunks: any[];
}): Promise<string> {
  const { query, context, targetTool, model } = params;

  // Build prompt based on target tool
  const systemPrompt = getSystemPrompt(targetTool);
  const userPrompt = `User Request: ${query}

Knowledge Base Context:
${context}

Generate a ${targetTool.toUpperCase()}-style prompt that:
1. Incorporates the user's documented preferences and conventions from the context above
2. Is ready to paste directly into ${targetTool.toUpperCase()}
3. Includes relevant constraints and context
4. Follows ${targetTool.toUpperCase()}'s best practices`;

  // Call the LLM
  const modelApiKey = getModelApiKey(model);
  
  if (!modelApiKey) {
    // Return a template-based prompt if no API key
    return generateTemplatePrompt(query, context, targetTool);
  }

  try {
    const response = await callLLM(model, systemPrompt, userPrompt, modelApiKey);
    return response;
  } catch (error) {
    console.error('Error calling LLM:', error);
    return generateTemplatePrompt(query, context, targetTool);
  }
}

// Get system prompt based on target tool
function getSystemPrompt(targetTool: string): string {
  const prompts: Record<string, string> = {
    claude: `You are an expert at generating detailed, structured prompts for Anthropic's Claude AI.
Generate prompts that are:
- Detailed and XML-tagged when appropriate
- Include context, constraints, and output format requirements
- Break down complex tasks into clear steps
- End with specific questions or tasks for the AI to perform`,
    
    bolt: `You are an expert at generating concise, UI/component-focused prompts for Vercel's Bolt.new.
Generate prompts that are:
- Concise and action-oriented
- Focus on visual components and UI elements
- Include specific design requirements
- Reference modern CSS/Tailwind practices`,
    
    cursor: `You are an expert at generating code-context focused prompts for Cursor AI.
Generate prompts that are:
- File-scoped and context-rich
- Include relevant code snippets
- Specify coding conventions and patterns
- Reference existing codebase structure`,
    
    v0: `You are an expert at generating UI/component prompts for Vercel's v0.
Generate prompts that are:
- Visual and component-focused
- Include design specifications
- Reference shadcn/ui and Tailwind best practices
- Be specific about layout and styling`,
  };

  return prompts[targetTool] || prompts.claude;
}

// Get API key for the selected model
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

// Call LLM API
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

// Call Gemini API
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
  return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Failed to generate prompt';
}

// Call Claude API (Anthropic)
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
  return data.content?.[0]?.text || 'Failed to generate prompt';
}

// Call Groq API
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
  return data.choices?.[0]?.message?.content || 'Failed to generate prompt';
}

// Generate template-based prompt as fallback
function generateTemplatePrompt(query: string, context: string, targetTool: string): string {
  const templates: Record<string, string> = {
    claude: `# Task Request

## Context
Based on your documented preferences:
${context}

## Task
${query}

## Requirements
- Follow your documented coding standards and conventions
- Use your preferred tech stack as documented
- Include appropriate error handling
- Write clean, maintainable code

## Output Format
Provide complete, production-ready code with:
- TypeScript types where applicable
- Inline documentation for complex logic
- Unit tests for core functionality`,
    
    bolt: `# UI/Component Request

## Your Preferences
${context}

## Component Requirements
${query}

## Design Guidelines
- Use Tailwind CSS for styling
- Follow mobile-first responsive design
- Include hover states and transitions
- Ensure accessibility

## Technical Stack
- React with TypeScript
- Lucide icons for iconography
- Glassmorphism aesthetic where appropriate`,
    
    cursor: `# Code Implementation

## Context from Your Codebase
${context}

## Task
${query}

## Implementation Notes
- Follow existing code patterns and conventions
- Use your established file structure
- Match the style of surrounding code
- Include appropriate imports`,
    
    v0: `# v0 Component Request

## Design Context
${context}

## Component Spec
${query}

## Technical Requirements
- React + TypeScript
- Tailwind CSS
- shadcn/ui components where applicable
- Mobile-responsive design`,
  };

  return templates[targetTool] || templates.claude;
}
