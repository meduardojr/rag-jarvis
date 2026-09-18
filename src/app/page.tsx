'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, RefreshCw, Database } from 'lucide-react';

import { JarvisLogo } from '@/components/ui/jarvis-logo';
import { HeroIllustration } from '@/components/ui/hero-illustration';
import { KnowledgeInput } from '@/components/knowledge-input';
import { SettingsPanel } from '@/components/settings-panel';
import { AboutMeChat } from '@/components/about-me-chat';
import { HistoryPanel } from '@/components/history-panel';
import { PromptGeneratorTab } from '@/components/prompt-generator-tab';
import { Button } from '@/components/ui/button';

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

export default function Home() {
  const [activeTab, setActiveTab] = useState<'about-me' | 'prompt-generator'>('about-me');

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

        {/* Combined Intro Section (Hero + Intro Text) */}
        <motion.div
          {...fadeIn}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-8 lg:mb-12"
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

        {/* Tabbed Section */}
        <motion.div
          {...fadeIn}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8 lg:mb-12"
        >
          {/* Tab Buttons */}
          <div className="flex border-b border-muted/50 mb-4">
            <button
              onClick={() => setActiveTab('about-me')}
              className={`flex-1 px-4 py-2 text-sm font-medium
                ${activeTab === 'about-me' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-muted-foreground/80'}`}
            >
              About Me Chat
            </button>
            <button
              onClick={() => setActiveTab('prompt-generator')}
              className={`flex-1 px-4 py-2 text-sm font-medium
                ${activeTab === 'prompt-generator' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-muted-foreground/80'}`}
            >
              Generate AI Prompt
            </button>
          </div>

          {/* Tab Content */}
          <div className="space-y-6">
            <AboutMeChat hidden={activeTab !== 'about-me'} />
            <PromptGeneratorTab hidden={activeTab !== 'prompt-generator'} />
          </div>
        </motion.div>

        {/* Settings Section */}
        <motion.div
          {...fadeIn}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-8 lg:mb-12"
        >
          <SettingsPanel />
        </motion.div>

        {/* Knowledge Entry Section */}
        <motion.div
          {...fadeIn}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-8 lg:mb-12"
        >
          <KnowledgeInput />
        </motion.div>

        {/* Full History Panel (below Knowledge Entry) */}
        <motion.div
          {...fadeIn}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mb-8 lg:mb-12"
        >
          <HistoryPanel />
        </motion.div>

        {/* Footer */}
        <motion.footer
          {...fadeIn}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-12 text-center text-xs text-muted-foreground flex items-center justify-center gap-2"
        >
          <p>Built with Next.js · v2.0 Personal Knowledge RAG</p>
        </motion.footer>
      </div>
    </div>
  );
}