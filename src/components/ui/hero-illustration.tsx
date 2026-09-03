'use client';

import {
  Database,
  Code2,
  LayoutGrid,
  Bot,
  Sparkles,
  GitBranch,
  Layers,
} from 'lucide-react';

export function HeroIllustration({ className }: { className?: string }) {
  return (
    <div className={`relative w-full h-96 ${className ?? ''}`}>
      {/* Background with gradient */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-indigo-900/50 via-purple-900/50 to-pink-900/50 backdrop-blur-xl" />

      {/* Grid pattern */}
      <div className="absolute inset-0 rounded-3xl overflow-hidden opacity-20">
        <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <pattern id="grid" width="8" height="8" patternUnits="userSpaceOnUse">
              <path d="M 8 0 L 0 0 0 8" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-indigo-400" />
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#grid)" />
        </svg>
      </div>

      {/* Floating knowledge nodes */}
      <div className="absolute inset-0">
        {/* Top-left node */}
        <div className="absolute top-6 left-6 glass-panel ai-primary p-3 rounded-xl floating" style={{ animationDelay: '0s' }}>
          <Database className="h-5 w-5 text-indigo-300" />
        </div>

        {/* Top-right node */}
        <div className="absolute top-12 right-8 glass-panel ai-secondary p-3 rounded-xl floating" style={{ animationDelay: '0.5s' }}>
          <Code2 className="h-5 w-5 text-purple-300" />
        </div>

        {/* Left middle node */}
        <div className="absolute top-1/2 left-4 glass-panel ai-accent p-3 rounded-xl floating" style={{ animationDelay: '1s' }}>
          <Layers className="h-5 w-5 text-indigo-300" />
        </div>

        {/* Right middle node */}
        <div className="absolute top-1/3 right-6 glass-panel ai-primary p-3 rounded-xl floating" style={{ animationDelay: '1.5s' }}>
          <GitBranch className="h-5 w-5 text-purple-300" />
        </div>

        {/* Bottom-left node */}
        <div className="absolute bottom-12 left-12 glass-panel ai-secondary p-3 rounded-xl floating" style={{ animationDelay: '2s' }}>
          <LayoutGrid className="h-5 w-5 text-indigo-300" />
        </div>

        {/* Bottom-right node */}
        <div className="absolute bottom-8 right-12 glass-panel ai-accent p-4 rounded-xl floating" style={{ animationDelay: '2.5s' }}>
          <Bot className="h-6 w-6 text-purple-300" />
        </div>

        {/* Sparkles */}
        <div className="absolute top-20 left-24">
          <Sparkles className="h-4 w-4 text-purple-300 animate-pulse" style={{ animationDelay: '0.3s' }} />
        </div>
        <div className="absolute bottom-24 left-32">
          <Sparkles className="h-3 w-3 text-indigo-300 animate-pulse" style={{ animationDelay: '1.2s' }} />
        </div>
        <div className="absolute top-32 right-20">
          <Sparkles className="h-4 w-4 text-purple-400 animate-pulse" style={{ animationDelay: '0.8s' }} />
        </div>
      </div>

      {/* Central pulsing core */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-24 h-24">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-500/30 to-purple-500/30 backdrop-blur-xl border border-indigo-400/30 shadow-[0_0_40px_rgba(99,102,241,0.4)] animate-pulse" />
          <div className="absolute inset-2 rounded-full bg-gradient-to-br from-indigo-600/40 to-purple-600/40 backdrop-blur-lg border border-indigo-300/20" />
          <Bot className="absolute inset-0 flex items-center justify-center h-10 w-10 text-white/80" />
        </div>
      </div>

      {/* Connecting lines */}
      <svg className="absolute inset-0 h-full w-full pointer-events-none">
        <defs>
          <linearGradient id="line-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(99, 102, 241, 0.3)" />
            <stop offset="100%" stopColor="rgba(168, 85, 247, 0.3)" />
          </linearGradient>
        </defs>
        {/* Decorative lines connecting nodes to center - simplified */}
        <circle cx="50" cy="50" r="25" fill="none" stroke="url(#line-gradient)" strokeWidth="0.5" strokeDasharray="2 2" />
      </svg>
    </div>
  );
}
