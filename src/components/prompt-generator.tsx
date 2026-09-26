'use client';

import { useState, useEffect } from 'react';
import {
  Copy,
  Bot,
  Sparkles,
  AlertCircle,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { AgentSelector } from '@/components/agent-selector';
import { ModelSelector } from '@/components/model-selector';
import { useJarvis } from '@/lib/jarvis-provider';

// Define the models (duplicated from settings-panel for now, but we can consider moving to a shared lib later)
const MODELS_CONST = [
  { id: 'gemini-flash', name: 'Gemini Flash', tier: 'free' },
  { id: 'groq-llama3', name: 'Groq Llama3 70B', tier: 'free' },
  { id: 'groq-mixtral', name: 'Groq Mixtral 8x7B', tier: 'free' },
  { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', tier: 'paid' },
  { id: 'gpt-4o', name: 'GPT-4o', tier: 'paid' },
  { id: 'deepseek-chat', name: 'DeepSeek Chat', tier: 'paid' },
  { id: 'qwen-flash', name: 'Qwen Flash', tier: 'paid' },
] as const;

// Define the target tools (agents) - duplicated from the existing TARGET_TOOLS in this file
const TARGET_TOOLS_CONST = [
  { value: 'claude', label: 'Claude (Anthropic)' },
  { value: 'bolt', label: 'Bolt.new' },
  { value: 'cursor', label: 'Cursor' },
  { value: 'v0', label: 'v0 (Vercel)' },
  { value: 'copilot', label: 'GitHub Copilot' },
  { value: 'general', label: 'General AI' },
] as const;

type TargetToolValue = typeof TARGET_TOOLS_CONST[number]['value'];

const TARGET_TOOLS = TARGET_TOOLS_CONST.map(t => ({ value: t.value, label: t.label }));
const MODELS = MODELS_CONST.map(m => ({ id: m.id, name: m.name, tier: m.tier }));

// Define the agent -> model mapping
// Base this on the existing models and the agents.
// For the Claude agent, we only allow the Claude model (since it's specific to Claude).
// For all other agents, we allow all models.
const freeModels = MODELS_CONST.filter((m) => m.tier === 'free').map((m) => m.id);
const paidModels = MODELS_CONST.filter((m) => m.tier === 'paid').map((m) => m.id);
const AGENT_MODEL_MAP: Record<TargetToolValue, string[]> = {
  claude: ['claude-3-5-sonnet'], // only the Claude model for Claude agent
  bolt: [...freeModels, ...paidModels], // all models for Bolt
  cursor: [...freeModels, ...paidModels], // all models for Cursor
  v0: [...freeModels, ...paidModels], // all models for v0
  copilot: [...freeModels, ...paidModels], // all models for Copilot
  general: [...freeModels, ...paidModels], // all models for General
};

export function PromptGenerator() {
  const { 
    isPasswordVerified, 
    addGeneratedPrompt, 
    verifyPassword,
    knowledgeEntries 
  } = useJarvis();
  const [query, setQuery] = useState('');
  const [agent, setAgent] = useState<TargetToolValue>('claude'); // default agent
  const [modelId, setModelId] = useState<string>('gemini-flash'); // default model
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [retrievedChunks, setRetrievedChunks] = useState<
    Array<{ id: number; title: string; content: string; similarity: number }>
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [isKnowledgeEntriesLoading, setIsKnowledgeEntriesLoading] = useState(true);
  const [hasCheckedKnowledgeEntries, setHasCheckedKnowledgeEntries] = useState(false);

  // Track knowledge entries loading state
  useEffect(() => {
    if (!hasCheckedKnowledgeEntries) {
      setIsKnowledgeEntriesLoading(true);
    }
    
    // Check if we have knowledge entries data
    if (knowledgeEntries !== undefined) {
      setHasCheckedKnowledgeEntries(true);
      setIsKnowledgeEntriesLoading(false);
    }
  }, [knowledgeEntries, hasCheckedKnowledgeEntries]);

  const selectedAgent = TARGET_TOOLS_CONST.find((t) => t.value === agent);
  const selectedModel = MODELS_CONST.find((m) => m.id === modelId);
  const isPaid = selectedModel?.tier === 'paid';

  const handleGeneratePrompt = async () => {
    if (!query.trim()) {
      toast.error('Please enter a query or specification');
      return;
    }

    // Check if we're still loading knowledge entries
    if (isKnowledgeEntriesLoading) {
      toast.error('Please wait while we load your knowledge base');
      return;
    }

    if (knowledgeEntries.length === 0) {
      toast.error('Please add at least one knowledge entry first');
      return;
    }

    // Check if the model is paid and require password verification
    if (isPaid && !isPasswordVerified) {
      toast.error('Password required for paid model. Please verify your password in the settings.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    try {
      // Call the chat API endpoint
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          target_tool: agent, // use the selected agent
          model: modelId, // use the selected model
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate prompt');
      }

      const result = await response.json();

      if (result.out_of_scope) {
        setGeneratedPrompt(result.message);
        setRetrievedChunks([]);
        toast.warning(result.suggestion || result.message);
        return;
      }

      setGeneratedPrompt(result.generated_prompt);
      setRetrievedChunks(
        result.retrieved_sources?.map((chunk: any) => ({
          id: chunk.id,
          title: chunk.title || `Chunk ${chunk.id}`,
          content: chunk.excerpt,
          similarity: chunk.similarity,
        })) || []
      );

      // Save to history via the provider
      addGeneratedPrompt({
        id: Date.now(),
        query,
        targetTool: selectedAgent?.label || agent,
        modelUsed: result.model_used,
        modelTier: result.model_tier,
        generatedOutput: result.generated_prompt,
        retrievedChunkIds: result.retrieved_sources?.map((c: any) => c.id) || [],
        createdAt: new Date(),
      });

      toast.success('Prompt generated successfully!');
    } catch (err: any) {
      console.error('Error generating prompt:', err);
      setError(err.message || 'An unknown error occurred');
      toast.error(err.message || 'Failed to generate prompt');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyPrompt = () => {
    navigator.clipboard
      .writeText(generatedPrompt)
      .then(() => toast.success('Prompt copied to clipboard!'))
      .catch(() => toast.error('Failed to copy prompt'));
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground/90">
          Generate AI Prompt
        </h2>
        <p className="text-sm text-muted-foreground">
          Create tailored AI prompts grounded in your knowledge base
        </p>
      </div>

      <div className="space-y-4">
        <Textarea
          placeholder="Describe what you want to build (e.g., 'Create a REST API for user auth using my usual stack')"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          rows={3}
          className="glass-panel-hover"
        />

        {/* Agent and Model Selection */}
        <div className="space-y-4">
          <div className="space-y-2">
            <AgentSelector
              value={agent}
              onValueChange={(value) => setAgent(value as TargetToolValue)}
              options={TARGET_TOOLS}
            />
          </div>
          <div className="space-y-2">
            <ModelSelector
              agent={agent}
              value={modelId}
              onValueChange={setModelId}
              models={MODELS}
              agentModelMap={AGENT_MODEL_MAP}
            />
          </div>
        </div>

        {/* Knowledge entries status */}
        {isKnowledgeEntriesLoading && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-500/5 border border-blue-500/20 text-blue-700 text-sm mt-2">
            <Bot className="h-4 w-4 animate-spin" />
            <span>Loading knowledge base...</span>
          </div>
        )}
        
        {!isKnowledgeEntriesLoading && knowledgeEntries.length === 0 && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-indigo-500/5 border border-indigo-500/10 text-xs text-muted-foreground">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>
              Add at least one knowledge entry above to start generating
              personalized prompts.
            </span>
          </div>
        )}

        {(!isKnowledgeEntriesLoading && knowledgeEntries.length > 0) || isKnowledgeEntriesLoading ? (
          <Button
            onClick={handleGeneratePrompt}
            disabled={isGenerating || isKnowledgeEntriesLoading}
            className="w-full ai-secondary flex items-center justify-center"
          >
            {isGenerating ? (
              <>
                <Bot className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : isKnowledgeEntriesLoading ? (
              <>
                <Bot className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Prompt
              </>
            )}
          </Button>
        ) : null}

        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-300 text-sm mt-2">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            {error}
          </div>
        )}
      </div>

      {/* Generated Prompt */}
      {generatedPrompt && (
        <div className="border-t pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground/90">
              Generated Prompt
            </h3>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyPrompt}
                className="glass-panel-hover"
              >
                <Copy className="h-3 w-3 mr-1" /> Copy
              </Button>
            </div>
          </div>

          <div className="glass-panel p-4 rounded-lg max-h-60 overflow-y-auto">
            <pre className="text-sm whitespace-pre-wrap break-words text-muted-foreground font-mono">
              {generatedPrompt}
            </pre>
          </div>

          {/* Retrieved Sources */}
          {retrievedChunks.length > 0 && (
            <div className="pt-2 border-t border-indigo-100/20">
              <h4 className="text-sm font-medium text-indigo-600 dark:text-indigo-300 mb-2 flex items-center gap-1">
                <Check className="h-3 w-3" />
                Retrieved from {retrievedChunks.length} knowledge entries:
              </h4>
              <div className="space-y-2 text-xs">
                {retrievedChunks.map((chunk) => (
                  <div
                    key={chunk.id}
                    className="flex items-start gap-2 p-2 rounded bg-indigo-500/5 border border-indigo-500/10"
                  >
                    <Badge
                      variant="outline"
                      className="text-xs shrink-0 mt-0.5"
                    >
                      {Math.round(chunk.similarity * 100)}%
                    </Badge>
                    <div className="min-w-0">
                      <div className="font-medium truncate">{chunk.title}</div>
                      <div className="text-muted-foreground line-clamp-1">
                        {chunk.content}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}