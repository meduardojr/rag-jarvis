'use client';

import { useState } from 'react';
import {
  Copy,
  Bot,
  Sparkles,
  Shield,
  AlertCircle,
  Check,
  KeyRound,
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
  { value: 'claude', label: 'Claude (Anthropic)', paid: true, model: 'claude-3-5-sonnet-20241022' },
  { value: 'bolt', label: 'Bolt.new', paid: false, model: 'bolt-default' },
  { value: 'cursor', label: 'Cursor', paid: false, model: 'cursor-default' },
  { value: 'v0', label: 'v0 (Vercel)', paid: false, model: 'v0-dev-model' },
  { value: 'copilot', label: 'GitHub Copilot', paid: true, model: 'gpt-4o' },
  { value: 'general', label: 'General AI', paid: false, model: 'general-llm' },
] as const;

type TargetToolValue = (typeof TARGET_TOOLS)[number]['value'];

export function PromptGenerator() {
  const { knowledgeEntries, addGeneratedPrompt, isPasswordVerified } = useJarvis();
  const [query, setQuery] = useState('');
  const [targetTool, setTargetTool] = useState<TargetToolValue>('claude');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [retrievedChunks, setRetrievedChunks] = useState<
    Array<{ id: string; title: string; content: string; relevance: number; category: string }>
  >([]);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [password, setPassword] = useState('');

  const selectedTool = TARGET_TOOLS.find((t) => t.value === targetTool);
  const requiresPassword = selectedTool?.paid ?? false;

  const handleGeneratePrompt = async () => {
    if (!query.trim()) {
      toast.error('Please enter a query or specification');
      return;
    }

    if (knowledgeEntries.length === 0) {
      toast.error('Please add at least one knowledge entry first');
      return;
    }

    if (requiresPassword && !isPasswordVerified) {
      setShowPasswordPrompt(true);
      toast.warning('Password required for paid model');
      return;
    }

    setIsGenerating(true);
    try {
      // Simulate RAG retrieval - in real app, this would use vector similarity search
      await new Promise((resolve) => setTimeout(resolve, 1200));

      // Mock retrieval: select top 3 most relevant entries based on keyword match
      const queryLower = query.toLowerCase();
      const queryWords = queryLower.split(/\s+/).filter((w) => w.length > 2);

      const scored = knowledgeEntries.map((entry) => {
        const text = `${entry.title} ${entry.content} ${entry.tags.join(' ')}`.toLowerCase();
        const score = queryWords.reduce((acc, word) => {
          return acc + (text.includes(word) ? 1 : 0);
        }, 0) / Math.max(queryWords.length, 1);
        return { entry, score: score + Math.random() * 0.1 };
      });

      const top = scored
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map((s) => ({
          id: s.entry.id,
          title: s.entry.title,
          content: s.entry.content,
          relevance: Math.min(0.99, Math.max(0.5, s.score + 0.5)),
          category: s.entry.category,
        }));

      setRetrievedChunks(top);

      // Generate tool-specific prompt
      const prompt = generatePromptForTool(
        targetTool,
        query,
        top,
        selectedTool!.model,
      );

      setGeneratedPrompt(prompt);

      // Save to history
      addGeneratedPrompt({
        id: crypto.randomUUID(),
        query,
        targetTool: selectedTool!.label,
        modelUsed: selectedTool!.model,
        generatedOutput: prompt,
        retrievedChunkIds: top.map((c) => c.id),
        createdAt: new Date(),
        isPaid: requiresPassword,
      });

      toast.success('Prompt generated successfully!');
    } catch (error) {
      toast.error('Failed to generate prompt');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePasswordSubmit = () => {
    if (password === 'jarvis123') {
      toast.success('Password verified');
      setShowPasswordPrompt(false);
      setPassword('');
      handleGeneratePrompt();
    } else {
      toast.error('Incorrect password (hint: try "jarvis123")');
    }
  };

  const handleCopyPrompt = () => {
    navigator.clipboard
      .writeText(generatedPrompt)
      .then(() => toast.success('Prompt copied to clipboard!'))
      .catch(() => toast.error('Failed to copy prompt'));
  };

  const generatePromptForTool = (
    tool: TargetToolValue,
    userQuery: string,
    chunks: typeof retrievedChunks,
    model: string,
  ): string => {
    const contextBlock = chunks
      .map(
        (chunk, idx) =>
          `[Source ${idx + 1}: ${chunk.title} | Category: ${chunk.category} | Relevance: ${(chunk.relevance * 100).toFixed(0)}%]\n${chunk.content}`,
      )
      .join('\n\n');

    switch (tool) {
      case 'claude':
        return `You are an expert AI coding assistant. Use the user's documented preferences below to inform your response.

<knowledge_base>
${contextBlock}
</knowledge_base>

<user_request>
${userQuery}
</user_request>

<instructions>
1. Ground your response strictly in the provided knowledge base.
2. If the knowledge base doesn't fully cover a topic, explicitly state what's missing.
3. Use the user's preferred stack, conventions, and architecture patterns.
4. Format code with proper syntax highlighting.
5. Be concise but thorough; prioritize actionable guidance.
6. Reference specific preferences by their source title when relevant.
</instructions>

Please provide your response:`;

      case 'bolt':
      case 'v0':
        return `Generate a frontend specification grounded in the user's preferences.

USER REQUEST: ${userQuery}

USER'S DOCUMENTED PREFERENCES:
${chunks
  .map(
    (c, i) =>
      `${i + 1}. [${c.title}] (${(c.relevance * 100).toFixed(0)}% match)\n   ${c.content.substring(0, 200)}${c.content.length > 200 ? '...' : ''}`,
  )
  .join('\n\n')}

REQUIRED OUTPUT:
- Component name & purpose
- Props interface with TypeScript types
- Tailwind utility class structure
- Implementation approach aligned with user's stack
- Key conventions to follow

Generate a ready-to-paste prompt for ${tool === 'v0' ? 'v0' : 'Bolt'}:`;

      case 'cursor':
      case 'copilot':
        return `Act as a pair programmer using the user's documented technical preferences.

CONTEXT (from user's knowledge base):
${chunks.map((c) => `• ${c.title}: ${c.content.substring(0, 150)}...`).join('\n')}

TASK: ${userQuery}

GENERATE CODE WITH:
1. File structure recommendations
2. Coding patterns matching the user's documented style
3. Library/framework choices aligned with their stack
4. Testing approach consistent with their preferences
5. Any conventions to follow (naming, structure, etc.)

Format for ${tool === 'cursor' ? 'Cursor' : 'GitHub Copilot'}:`;

      default:
        return `USER'S TECHNICAL PREFERENCES:
${contextBlock}

USER QUERY: ${userQuery}

Generate a detailed, personalized prompt that incorporates the above knowledge. Use the user's preferred stack, architecture, and conventions. Reference specific preferences when relevant.`;
    }
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
                  {tool.paid && (
                    <Badge variant="secondary" className="text-xs">
                      Paid
                    </Badge>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {requiresPassword && !isPasswordVerified && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs">
            <Shield className="h-4 w-4 mt-0.5 shrink-0" />
            <span>This is a paid model. You'll be asked for the password to prevent accidental costs.</span>
          </div>
        )}

        {showPasswordPrompt && (
          <div className="space-y-2 p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
            <div className="flex items-center gap-2 text-xs font-medium text-indigo-700 dark:text-indigo-300">
              <KeyRound className="h-4 w-4" />
              Password required for paid model
            </div>
            <div className="flex gap-2">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                placeholder="Enter password"
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <Button size="sm" onClick={handlePasswordSubmit}>
                Verify
              </Button>
            </div>
          </div>
        )}

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
                      {(chunk.relevance * 100).toFixed(0)}%
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
