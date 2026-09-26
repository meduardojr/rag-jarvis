'use client';

import { Badge } from '@/components/ui/badge';

interface ChunkStatusBadgeProps {
  chunked: boolean;
}

export function ChunkStatusBadge({ chunked }: ChunkStatusBadgeProps) {
  return (
    <Badge
      variant={chunked ? 'secondary' : 'outline'}
      className="text-xs"
    >
      {chunked ? 'Chunked' : 'Not Chunked'}
    </Badge>
  );
}