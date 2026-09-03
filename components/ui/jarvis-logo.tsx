import { BrainCircuit, Sparkles, Bot } from 'lucide-react';

export function JarvisLogo({ className, ...props }: { 
  className?: string; 
  [key: string]: any 
}) {
  return (
    <div className={`relative w-16 h-16 flex items-center justify-center ${className}`}>
      {/* Outer glowing circle */}
      <div className="absolute -inset-0.5 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 opacity-20 blur-3xl"></div>
      
      {/* Main icon */}
      <div className="relative z-10 flex h-12 w-12 items-center justify-center bg-white/20 backdrop-blur-lg rounded-full border border-white/20">
        <BrainCircuit 
          className="h-6 w-6 text-indigo-400" 
          {...props} 
        />
      </div>
      
      {/* Sparkles effect */}
      <div className="absolute -inset-1 flex items-center justify-center pointer-events-none">
        <Sparkles className="h-4 w-4 text-purple-300 opacity-0 animate-pulse" />
      </div>
    </div>
  );
}