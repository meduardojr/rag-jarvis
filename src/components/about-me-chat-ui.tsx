'use client';

import { useState } from 'react';
import { ArrowUpIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export function AboutMeChatUI() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/about-me-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get answer');
      }

      setAnswer(data.answer);
      setQuestion('');
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-t pt-4">
        <h2 className="text-xl font-semibold text-foreground/90">
          About Me Chat
        </h2>
        <p className="text-sm text-muted-foreground">
          Ask me about my technical stack, skills, past projects, or what I know/do.
        </p>
      </div>

      <div className="space-y-4">
        {/* Chat messages */}
        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
          {/* User question */}
          {question && (
            <div className="flex justify-end">
              <div className="max-w-xs rounded-lg bg-primary/10 text-primary p-3">
                {question}
              </div>
            </div>
          )}
          {/* Bot answer */}
          {answer && (
            <div className="flex justify-start">
              <div className="max-w-xs rounded-lg bg-muted/80 text-muted-foreground p-3">
                {answer}
              </div>
            </div>
          )}
          {/* Loading state */}
          {isLoading && !answer && !question && (
            <div className="flex justify-start">
              <div className="flex items-center space-x-2 rounded-lg bg-muted/80 p-3">
                <ArrowUpIcon className="h-4 w-4 animate-spin" />
                <span>Thinking...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input area */}
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <Textarea
            placeholder="Ask about my stack, skills, or projects..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={2}
            className="flex-1 resize-none glass-panel-hover h-[3.5rem] min-h-[3.5rem] overflow-y-auto"
            disabled={isLoading}
          />
          <Button
            type="submit"
            disabled={isLoading || !question.trim()}
            className="h-10 w-10 flex-0 ai-primary"
          >
            {isLoading ? (
              <ArrowUpIcon className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowUpIcon className="h-4 w-4" />
            )}
          </Button>
        </form>

        {/* Error message */}
        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-300 text-sm">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}