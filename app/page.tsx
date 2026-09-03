import { MotionProps, motion } from 'framer-motion';
import { JarvisLogo } from '@/components/ui/jarvis-logo';
import { HeroIllustration } from '@/components/ui/hero-illustration';
import { KnowledgeInput } from '@/components/knowledge-input';
import { PromptGenerator } from '@/components/prompt-generator';
import { HistoryPanel } from '@/components/history-panel';
import { SettingsPanel } from '@/components/settings-panel';

export default function Home() {
  const heroMotion: MotionProps = {
    initial: { y: 20, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    transition: { duration: 0.8, ease: [0.25, 0.1, 0.25, 1] },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900 dark:to-purple-900">
      {/* Animated gradient background */}
      <div className="absolute inset-0 animated-gradient opacity-10 pointer-events-none"></div>
      
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-12 sm:py-16 lg:flex-row lg:items-start">
        {/* Left Column - Logo and Illustration */}
        <div className="w-full max-w-2xl space-y-8 mb-12 lg:mb-0 lg:w-1/2 lg:pr-12">
          <motion.div {...heroMotion} className="flex items-center justify-center space-x-4">
            <JarvisLogo className="h-16 w-16" />
            <h1 className="text-4xl font-bold text-center lg:text-left">
              JARVIS<span className="text-indigo-500">.</span>
            </h1>
          </motion.div>
          
          <motion.div 
            {...heroMotion} 
            transition={{ delay: 0.2, duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
            className="flex items-center justify-center"
          >
            <HeroIllustration className="w-full max-w-xl h-96" />
          </motion.div>
        </div>

        {/* Right Column - Main Interface */}
        <div className="w-full max-w-xl space-y-6 lg:w-1/2">
          <motion.div 
            {...heroMotion} 
            transition={{ delay: 0.4, duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
            className="glass-panel ai-primary p-6 rounded-xl"
          >
            <KnowledgeInput />
          </motion.div>

          <motion.div 
            {...heroMotion} 
            transition={{ delay: 0.6, duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
            className="glass-panel ai-secondary p-6 rounded-xl"
          >
            <PromptGenerator />
          </motion.div>

          <motion.div 
            {...heroMotion} 
            transition={{ delay: 0.8, duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
            className="flex flex-col lg:flex-row lg:space-x-4"
          >
            <div className="w-full lg:w-1/2 glass-panel ai-accent p-6 rounded-xl">
              <HistoryPanel />
            </div>
            <div className="w-full lg:w-1/2 glass-panel ai-accent p-6 rounded-xl">
              <SettingsPanel />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}