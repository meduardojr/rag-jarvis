import { 
  Zap, 
  Database, 
  Code, 
  Layout, 
  Bot, 
  Sparkles, 
  TrendingUp 
} from 'lucide-react';

export function HeroIllustration({ className, ...props }: { 
  className?: string; 
  [key: string]: any 
}) {
  return (
    <div className={`relative w-full h-96 ${className}`}>
      {/* Background grid */}
      <div className="absolute inset-0 -z-10">
        <div className="h-full w-full">
          <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(99, 102, 241, 0.1)" stroke-width="0.5"/>
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#grid)" />
          </svg>
        </div>
      </div>

      {/* Floating elements */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Database */}
        <div className="absolute top-10 left-8 glass-panel ai-primary p-3 rounded-lg w-16 h-16 flex items-center justify-center floating" 
             style={{ animationDelay: '0s' }}>
          <Database className="h-5 w-5 text-indigo-400" />
        </div>
        
        {/* Code */}
        <div className="absolute top-20 right-10 glass-panel ai-secondary p-3 rounded-lg w-16 h-16 flex items-center justify-center floating"
             style={{ animationDelay: '2s' }}>
          <Code className="h-5 w-5 text-purple-400" />
        </div>
        
        {/* Layout/Architecture */}
        <div className="absolute bottom-12 left-16 glass-panel ai-accent p-3 rounded-lg w-16 h-16 flex items-center justify-center floating"
             style={{ animationDelay: '4s' }}>
          <Layout className="h-5 w-5 text-indigo-300" />
        </div>
        
        {/* AI Bot */}
        <div className="absolute bottom-8 right-12 glass-panel ai-primary p-3 rounded-lg w-20 h-20 flex items-center justify-center floating"
             style={{ animationDelay: '1s' }}>
          <Bot className="h-6 w-6 text-indigo-400" />
        </div>
        
        {/* Sparkles */}
        <div className="absolute top-16 left-24">
          <Sparkles className="h-4 w-4 text-purple-300 animate-pulse" style={{ animationDelay: '0.5s' }} />
        </div>
        <div className="absolute bottom-20 left-32">
          <Sparkles className="h-3 w-3 text-indigo-300 animate-pulse" style={{ animationDelay: '2.5s' }} />
        </div>
        <div className="absolute top-40 right-20">
          <Sparkles className="h-5 w-5 text-purple-400 animate-pulse" style={{ animationDelay: '1.5s' }} />
        </div>
        
        {/* Trending up - showing growth */}
        <div className="absolute top-8 right-8 glass-panel ai-secondary p-2 rounded-lg w-12 h-12 flex items-center justify-center"
             style={{ animationDelay: '3s' }}>
          <TrendingUp className="h-4 w-4 text-purple-300" />
        </div>
      </div>

      {/* Central pulsing core */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative w-24 h-24">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 backdrop-blur-lg 
                        border border-indigo-500/30 shadow-[0_0_30px_rgba(99,102,241,0.3)] pulse"></div>
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-500/10 to-purple-500/10 backdrop-blur-lg 
                        border border-indigo-500/20 animate-pulse"></div>
          <Bot className="absolute inset-0 flex items-center justify-center h-10 w-10 text-indigo-400/80" />
        </div>
      </div>
    </div>
  );
}