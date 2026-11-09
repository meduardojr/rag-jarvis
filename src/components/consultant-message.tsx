'use client';

import { Bot, User, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// A single message in the Chat Consultant conversation.
export function ConsultantMessage({
  role,
  content,
  inScope,
  grounded,
  sources,
  error,
  onRetry,
}: {
  role: 'user' | 'assistant';
  content: string;
  inScope?: boolean;
  grounded?: boolean;
  sources?: string[];
  error?: boolean;
  onRetry?: () => void;
}) {
  const isUser = role === 'user';

  // Show the "not from knowledge base" badge only when the question was
  // accepted (in_scope === true) but no grounded context was found.
  const showUngroundedBadge =
    role === 'assistant' && inScope === true && grounded === false;

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground'
        }`}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>

      <div
        className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? 'bg-primary text-primary-foreground'
            : error
            ? 'bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-300'
            : 'glass-panel border border-muted/50'
        }`}
      >
        <p className="whitespace-pre-wrap break-words">{content}</p>

        {showUngroundedBadge && (
          <Badge
            variant="outline"
            className="mt-2 text-xs text-muted-foreground"
          >
            Not from your knowledge base
          </Badge>
        )}

        {sources && sources.length > 0 && (
          <p className="mt-2 text-xs text-muted-foreground">
            Sources: {sources.join(', ')}
          </p>
        )}

        {error && onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="mt-2 h-7 px-2 text-xs"
          >
            <RefreshCw className="h-3 w-3 mr-1" /> Retry
          </Button>
        )}
      </div>
    </div>
  );
}