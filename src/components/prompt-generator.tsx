'use client';

import { useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useJarvis } from '@/lib/jarvis-provider';

const TARGET_TOOLS = [
  { value: 'claude', label: 'Claude (Anthropic)' },
  { value: 'bolt', label: 'Bolt.new' },
  { value: 'cursor', label: 'Cursor' },
  { value: 'v0', label: 'v0 (Vercel)' },
  { value: 'copilot', label: 'GitHub Copilot' },
  { value: 'general', label: 'General AI' },
] as const;

type TargetToolValue = (typeof TARGET_TOOLS)[number]['value'];

export function PromptGenerator() {
  const { 
    isPasswordVerified, 
    addGeneratedPrompt, 
    verifyPassword,
    knowledgeEntries 
  } = useJarvis();
  const [query, setQuery] = useState('');
  const [targetTool, setTargetTool] = useState<TargetToolValue>('claude');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [retrievedChunks, setRetrievedChunks] = useState<
    Array<{ id: number; title: string; content: string; similarity: number }>
  >([]);
  const [error, setError] = useState<string | null>(null);

  const selectedTool = TARGET_TOOLS.find((t) => t.value === targetTool);

  const handleGeneratePrompt = async () => {
    if (!query.trim()) {
      toast.error('Please enter a query or specification');
      return;
    }

    if (knowledgeEntries.length === 0) {
      toast.error('Please add at least one knowledge entry first');
      return;
    }

    // Check if the model is paid and require password verification
    const paidTools = ['claude', 'copilot'];
    const isPaid = paidTools.includes(targetTool);
    if (isPaid && !isPasswordVerified) {
      toast.error('Password required for paid model. Please verify your password in the settings.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    try {
      // Call the generate-prompt API endpoint
      const response = await fetch('/api/generate-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_query: query,
          target_tool: targetTool,
          model: targetTool === 'claude' ? 'claude-3-5-sonnet-20241022' : 
                 targetTool === 'copilot' ? 'gpt-4o' : 
                 targetTool === 'bolt' ? 'bolt-default' :
                 targetTool === 'v0' ? 'v0-dev-model' :
                 targetTool === 'cursor' ? 'cursor-default' : 'general-llm',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate prompt');
      }

      const result = await response.json();

      if (result.isOutOfScope) {
        setGeneratedPrompt(result.message);
        setRetrievedChunks([]);
        toast.warning(result.message);
        return;
      }

      setGeneratedPrompt(result.generatedPrompt);
      setRetrievedChunks(
        result.usedChunks.map((chunk: any) => ({
          id: chunk.id,
          title: chunk.title || `Chunk ${chunk.id}`,
          content: chunk.text,
          similarity: chunk.similarity,
        }))
      );

      // Save to history via the provider
      addGeneratedPrompt({
        id: Date.now(),
        query,
        targetTool: selectedTool?.label || targetTool,
        modelUsed: targetTool,
        generatedOutput: result.generatedPrompt,
        retrievedChunkIds: result.usedChunks.map((c: any) => c.id),
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

        <Select
          value={targetTool}
          onValueChange={(v) => setTargetTool(v as TargetToolValue)}
        >
          <SelectTrigger className="w-full glass-panel-hover">
            <SelectValue placeholder="Select target AI tool" />
          </SelectTrigger>
          <SelectContent className="w-full glass-panel">
            {TARGET_TOOLS.map((tool) => (
              <SelectItem key={tool.value} value={tool.value}>
                <div className="flex items-center gap-2">
                  <span>{tool.label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          onClick={handleGeneratePrompt}
          disabled={isGenerating}
          className="w-full ai-secondary flex items-center justify-center"
        >
          {isGenerating ? (
            <>
              <Bot className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Prompt
            </>
          )}
        </Button>

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

      {knowledgeEntries.length === 0 && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-indigo-500/5 border border-indigo-500/10 text-xs text-muted-foreground">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>
            Add at least one knowledge entry above to start generating
            personalized prompts.
          </span>
        </div>
      )}
    </div>
  );
}