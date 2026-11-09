'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, AlertCircle, Bot, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ConsultantMessage } from '@/components/consultant-message';

// A single message in the conversation state.
type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  inScope?: boolean;
  grounded?: boolean;
  sources?: string[];
};

export function ConsultantChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/consultant-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: input }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response');
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.answer,
        inScope: data.in_scope,
        grounded: data.grounded,
        sources: data.sources,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      toast.error(errorMessage);

      // Add error message to conversation
      const errorAssistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${errorMessage}. Please try again.`,
        inScope: false,
        grounded: false,
      };
      setMessages((prev) => [...prev, errorAssistantMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-full min-h-[500px] flex-col rounded-2xl border border-muted/50 bg-background shadow-lg">
      {/* Header */}
      <div className="border-b border-muted/50 bg-muted/20 px-4 py-3">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-indigo-500" />
          <h2 className="text-lg font-semibold">Chat Consultant</h2>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
            <MessageSquare className="mb-3 h-12 w-12 opacity-50" />
            <p className="mb-1 text-sm font-medium">No conversation yet</p>
            <p className="text-xs">
              Ask a question about software development, architecture, tooling, or deployment.
            </p>
          </div>
        ) : (
          <div className="space-y-4 pb-4">
            {messages.map((msg) => (
              <ConsultantMessage
                key={msg.id}
                role={msg.role}
                content={msg.content}
                inScope={msg.inScope}
                grounded={msg.grounded}
                sources={msg.sources}
              />
            ))}
            {isLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Bot className="h-4 w-4 animate-spin" />
                <span>Thinking...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Error display */}
      {error && (
        <div className="border-t border-muted/50 bg-red-500/10 px-4 py-2">
          <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setError(null)}
              className="ml-auto h-6 px-2 text-xs"
            >
              Dismiss
            </Button>
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="border-t border-muted/50 bg-muted/20 p-4">
        <div className="flex gap-2">
          <Input
            placeholder="Ask about software, architecture, tooling, or deployment..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            className="flex-1 glass-panel-hover"
          />
          <Button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="ai-primary"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}