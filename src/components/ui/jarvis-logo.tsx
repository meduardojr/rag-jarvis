'use client';

import { Brain, Sparkles } from 'lucide-react';

export function JarvisLogo({
  className,
}: {
  className?: string;
}) {
  return (
    <div className={`relative ${className ?? ''}`}>
      <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 opacity-30 blur-xl" />
      <div className="relative flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-purple-700 shadow-2xl shadow-indigo-500/30 ring-1 ring-white/20">
        <Brain className="h-1/2 w-1/2 text-white" strokeWidth={1.5} />
        <Sparkles
          className="absolute -right-1 -top-1 h-1/3 w-1/3 text-purple-300"
          strokeWidth={2}
        />
      </div>
    </div>
  );
}
