'use client';

import { Bot, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// A single message in the Chat Consultant conversation.
export function ConsultantMessage({
  role,
  content,
  inScope,
  grounded,
  sources,
}: {
  role: 'user' | 'assistant';
  content: string;
  inScope?: boolean;
  grounded?: boolean;
  sources?: string[];
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
      </div>
    </div>
  );
}