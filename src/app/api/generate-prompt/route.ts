import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';
import { getEmbedding } from '@/lib/embeddings';
import { getTemplate } from '@/lib/prompt-templates';
import { isPaidModel } from '@/lib/models';
import { getPreferenceScores, shouldAutoPick, recordPreference } from '@/lib/preference';

function cosineSimilarity(vecA: number[], vecB: number[]): number {
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const normA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const normB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (normA * normB);
}

export async function POST(request: Request) {
  try {
    const { user_query, target_tool, model } = await request.json();

    if (!user_query || !target_tool || !model) {
      return NextResponse.json(
        { error: 'User query, target tool, and model are required' },
        { status: 400 }
      );
    }

    const session = getSessionFromRequest(request);
    if (isPaidModel(model) && !session) {
      return NextResponse.json({ error: 'Unauthorized: paid model requires password verification' }, { status: 401 });
    }

    let queryEmbedding: number[];
    try {
      queryEmbedding = await getEmbedding(user_query);
    } catch (embedError) {
      console.error('Error getting query embedding:', embedError);
      return NextResponse.json({ error: 'Failed to get query embedding. Please check your OpenAI API key.' }, { status: 500 });
    }

    const chunks = await sql`
      SELECT id, chunk_text, embedding_vector
      FROM chunks
    ` as Array<{ id: number; chunk_text: string; embedding_vector: number[] }>;

    const scoredChunks = chunks
      .map((chunk) => {
        const similarity = cosineSimilarity(queryEmbedding, chunk.embedding_vector);
        return { ...chunk, similarity };
      })
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5);

    const SIMILARITY_THRESHOLD = 0.5;
    if (scoredChunks.length === 0 || scoredChunks[0].similarity < SIMILARITY_THRESHOLD) {
      const outOfScopeResponse = {
        isOutOfScope: true,
        message: `I don't have sufficient knowledge in your personal knowledge base to accurately address "${user_query}". This topic may not be covered in your documented stacks, architectures, or conventions.`,
        suggestion: `Consider adding relevant notes to your knowledge base about this topic if you'd like to generate prompts for it in the future.`,
      };
      return NextResponse.json(outOfScopeResponse);
    }

    const knowledgeContext = scoredChunks
      .map((chunk, index) => `[Source ${index + 1}]:\n${chunk.chunk_text}`)
      .join('\n\n');

    const branchingCategories = [
      { category: 'state_management', options: ['zustand', 'redux', 'context-api', 'recoil', 'jotai'] },
      { category: 'orm', options: ['prisma', 'typeorm', 'sequelize', 'mongoose'] },
      { category: 'testing_framework', options: ['jest', 'vitest', 'mocha', 'chai'] },
      { category: 'ui_library', options: ['shadcn-ui', 'material-ui', 'ant-design', 'chakra-ui'] },
      { category: 'backend_framework', options: ['express', 'nestjs', 'fastify', 'koa'] },
    ];

    const relevantCategories = branchingCategories.filter((cat) =>
      cat.options.some((option) =>
        knowledgeContext.toLowerCase().includes(option) || user_query.toLowerCase().includes(option)
      )
    );

    const resolvedOptions: Record<string, string> = {};

    for (const { category, options } of relevantCategories) {
      const { shouldPick, topOption } = await shouldAutoPick(category);
      if (shouldPick && topOption) {
        resolvedOptions[category] = topOption;
        await recordPreference(category, topOption, user_query);
      } else {
        const clarificationResponse = {
          needsClarification: true,
          category,
          options,
          message: `You've noted multiple options for ${category}: ${options.join(', ')}. Which would you like to use for this prompt?`,
        };
        return NextResponse.json(clarificationResponse, { status: 200 });
      }
    }

    const preferenceNote = Object.entries(resolvedOptions)
      .map(([category, option]) => `Resolved preference for ${category}: ${option}`)
      .join('\n');

    const enhancedKnowledgeContext = preferenceNote
      ? `${knowledgeContext}\n\n---\nUser Preferences (auto-resolved):\n${preferenceNote}`
      : knowledgeContext;

    const template = getTemplate(target_tool);

    const finalPrompt = template
      .replace('{user_query}', user_query)
      .replace('{knowledge_context}', enhancedKnowledgeContext);

    let generatedOutput: string;

    if (model.startsWith('gpt-') || model.startsWith('text-')) {
      const OpenAI = require('openai');
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      const completion = await openai.chat.completions.create({
        model: model,
        messages: [{ role: 'user', content: finalPrompt }],
        max_tokens: 500,
        temperature: 0.7,
      });
      generatedOutput = completion.choices[0].message.content ?? '';
    } else if (model.startsWith('claude-')) {
      return NextResponse.json(
        { error: `Model ${model} is not implemented yet. Please use a different model.` },
        { status: 501 }
      );
    } else {
      return NextResponse.json(
        { error: `Model ${model} is not implemented yet. Please use a different model.` },
        { status: 501 }
      );
    }

    const [historyEntry] = await sql`
      INSERT INTO generated_prompts (user_query, target_tool, model_used, model_tier, retrieved_chunk_ids, generated_output)
      VALUES (
        ${user_query},
        ${target_tool},
        ${model},
        ${isPaidModel(model) ? 'paid' : 'free'},
        ${scoredChunks.map((chunk) => chunk.id)},
        ${generatedOutput}
      )
      RETURNING id, user_query, target_tool, model_used, model_tier, retrieved_chunk_ids, generated_output, created_at
    `;

    return NextResponse.json({
      isOutOfScope: false,
      generatedPrompt: generatedOutput,
      usedChunks: scoredChunks.map((chunk) => ({
        id: chunk.id,
        title: `Chunk ${chunk.id}`,
        text: chunk.chunk_text,
        similarity: chunk.similarity,
      })),
      resolvedPreferences: resolvedOptions,
      historyId: historyEntry.id,
    });
  } catch (error) {
    console.error('Error generating prompt:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}