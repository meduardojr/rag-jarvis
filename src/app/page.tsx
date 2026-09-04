'use client';

import { motion } from 'framer-motion';
import { AlertCircle, RefreshCw, Database } from 'lucide-react';

import { JarvisLogo } from '@/components/ui/jarvis-logo';
import { HeroIllustration } from '@/components/ui/hero-illustration';
import { KnowledgeInput } from '@/components/knowledge-input';
import { PromptGenerator } from '@/components/prompt-generator';
import { HistoryPanel } from '@/components/history-panel';
import { SettingsPanel } from '@/components/settings-panel';
import { Button } from '@/components/ui/button';
import {
  KnowledgeInputSkeleton,
  PromptGeneratorSkeleton,
  HistoryPanelSkeleton,
  SettingsPanelSkeleton,
} from '@/components/ui/skeleton-panel';
import { useJarvis } from '@/lib/jarvis-provider';

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

export default function Home() {
  const { isLoading, error, refreshData } = useJarvis();

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      {/* Background gradient orbs */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-20 w-96 h-96 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute top-1/3 -right-20 w-96 h-96 rounded-full bg-purple-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-96 h-96 rounded-full bg-pink-500/10 blur-3xl" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 lg:py-12 max-w-7xl">
        {/* Header */}
        <motion.header
          {...fadeIn}
          transition={{ duration: 0.6 }}
          className="mb-8 lg:mb-12"
        >
          <div className="flex items-center gap-3">
            <JarvisLogo className="h-10 w-10 lg:h-12 lg:w-12" />
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">
                <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  JARVIS
                </span>
              </h1>
              <p className="text-xs lg:text-sm text-muted-foreground">
                Personal Knowledge RAG Assistant
              </p>
            </div>
          </div>
        </motion.header>

        {/* Error State */}
        {error && !isLoading && (
          <motion.div
            {...fadeIn}
            transition={{ duration: 0.4 }}
            className="glass-panel p-6 rounded-2xl border border-red-500/30 mb-6"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 shrink-0" />
              <div className="flex-1 space-y-2">
                <h3 className="font-semibold text-red-400">Connection Error</h3>
                <p className="text-sm text-muted-foreground">
                  {error}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshData}
                  className="mt-2"
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-1" />
                  Retry Connection
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left Column - Hero */}
          <motion.div
            {...fadeIn}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="lg:col-span-2 space-y-6"
          >
            <HeroIllustration className="w-full" />

            <div className="glass-panel ai-primary p-6 rounded-2xl">
              <h2 className="text-lg font-semibold mb-2">
                Your AI-Powered Prompt Assistant
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Build your personal knowledge base, then generate tailored AI
                prompts grounded in your real preferences and conventions —
                ready to paste into Claude, Bolt, Cursor, v0, and more.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="text-xs px-2 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  🔍 RAG-powered
                </span>
                <span className="text-xs px-2 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  🎯 Tool-specific
                </span>
                <span className="text-xs px-2 py-1 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30">
                  🔐 Password-gated
                </span>
                <span className="text-xs px-2 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  💾 Self-hosted data
                </span>
              </div>
            </div>
          </motion.div>

          {/* Right Column - Functional Panels */}
          <div className="lg:col-span-3 space-y-6">
            <motion.div
              {...fadeIn}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="glass-panel ai-primary p-6 rounded-2xl">
                {isLoading ? <KnowledgeInputSkeleton /> : <KnowledgeInput />}
              </div>
            </motion.div>

            <motion.div
              {...fadeIn}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <div className="glass-panel ai-secondary p-6 rounded-2xl">
                {isLoading ? <PromptGeneratorSkeleton /> : <PromptGenerator />}
              </div>
            </motion.div>

            <motion.div
              {...fadeIn}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              <div className="glass-panel ai-accent p-6 rounded-2xl">
                {isLoading ? <HistoryPanelSkeleton /> : <HistoryPanel />}
              </div>
              <div className="glass-panel ai-accent p-6 rounded-2xl">
                {isLoading ? <SettingsPanelSkeleton /> : <SettingsPanel />}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Footer */}
        <motion.footer
          {...fadeIn}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-12 text-center text-xs text-muted-foreground flex items-center justify-center gap-2"
        >
          {isLoading && (
            <>
              <Database className="h-3 w-3 animate-pulse" />
              <span>Connecting to database...</span>
            </>
          )}
          {!isLoading && !error && (
            <p>Built with Next.js · v2.0 Personal Knowledge RAG</p>
          )}
        </motion.footer>
      </div>
    </div>
  );
}
