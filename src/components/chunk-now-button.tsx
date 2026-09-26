'use client';

import { useState } from 'react';
import { AlertCircle, Check, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface ChunkNowButtonProps {
  entryId: string;
  onChunkSuccess: () => void; // Callback to refetch or update state after success
}

export function ChunkNowButton({ entryId, onChunkSuccess }: ChunkNowButtonProps) {
  const [isChunking, setIsChunking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChunkNow = async () => {
    setIsChunking(true);
    setError(null);
    try {
      const response = await fetch(`/api/knowledge-entries/${entryId}/chunk`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to chunk entry');
      }

      // If successful, call the callback to update the state
      await onChunkSuccess();
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setIsChunking(false);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      {isChunking ? (
        <Button variant="outline" size="icon" disabled>
          <Loader2 className="h-4 w-4 animate-spin" />
        </Button>
      ) : error ? (
        <Button variant="outline" size="icon" onClick={() => setError(null)}>
          <AlertCircle className="h-4 w-4 text-red-500" />
        </Button>
      ) : (
        <Button
          variant="outline"
          size="icon"
          onClick={handleChunkNow}
          className="hover:bg-accent/50"
        >
          <Check className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}