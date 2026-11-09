'use client';

import { motion } from 'framer-motion';
import { AlertCircle, RefreshCw, Database } from 'lucide-react';

import { JarvisLogo } from '@/components/ui/jarvis-logo';
import { HeroIllustration } from '@/components/ui/hero-illustration';
import { KnowledgeInput } from '@/components/knowledge-input';
import { SettingsPanel } from '@/components/settings-panel';
import { ConsultantChat } from '@/components/consultant-chat';
import { Button } from '@/components/ui/button';

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

export default function Home() {
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
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-col lg:flex-row gap-8">
              <div className="flex-shrink-0 lg:w-[300px]">
                <HeroIllustration className="h-96 w-full lg:h-[300px] lg:w-full lg:aspect-[1/1]" />
              </div>
              <div className="flex-1 lg:w-1/2">
                <div className="glass-panel ai-primary p-6 rounded-2xl">
                  <h2 className="text-lg font-semibold mb-2">
                    Your AI-Powered Technical Consultant
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Ask questions about software development, architecture,
                    tooling, or deployment, and get answers grounded in your
                    personal knowledge base.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="text-xs px-2 py-1 rounded-full bg-indigo-500/20 text-indigo-600 border border-indigo-500/30">
                      🔍 RAG-powered
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-purple-500/20 text-purple-600 border border-purple-500/30">
                      🎯 Tool-specific
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-pink-500/20 text-pink-600 border border-pink-500/30">
                      🔐 Password-gated
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-indigo-500/20 text-indigo-600 border border-indigo-500/30">
                      💾 Self-hosted data
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Chat Consultant Section */}
        <motion.div
          {...fadeIn}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8 lg:mb-12"
        >
          <div className="mx-auto max-w-6xl">
            <ConsultantChat />
          </div>
        </motion.div>

        {/* Settings Section */}
        <motion.div
          {...fadeIn}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-8 lg:mb-12"
        >
          <div className="mx-auto max-w-6xl">
            <SettingsPanel />
          </div>
        </motion.div>

        {/* Knowledge Entry Section */}
        <motion.div
          {...fadeIn}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-8 lg:mb-12"
        >
          <div className="mx-auto max-w-6xl">
            <KnowledgeInput />
          </div>
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