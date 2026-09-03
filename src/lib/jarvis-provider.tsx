'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface KnowledgeEntry {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  createdAt: Date;
}

interface GeneratedPrompt {
  id: string;
  query: string;
  targetTool: string;
  modelUsed: string;
  generatedOutput: string;
  retrievedChunkIds: string[];
  createdAt: Date;
  isPaid: boolean;
}

interface JarvisContextType {
  isPasswordVerified: boolean;
  setPasswordVerified: (verified: boolean) => void;
  knowledgeEntries: KnowledgeEntry[];
  addKnowledgeEntry: (entry: KnowledgeEntry) => void;
  updateKnowledgeEntry: (id: string, entry: KnowledgeEntry) => void;
  deleteKnowledgeEntry: (id: string) => void;
  generatedPrompts: GeneratedPrompt[];
  addGeneratedPrompt: (prompt: GeneratedPrompt) => void;
  clearHistory: () => void;
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

const JarvisContext = createContext<JarvisContextType | undefined>(undefined);

export function JarvisProvider({ children }: { children: ReactNode }) {
  const [isPasswordVerified, setPasswordVerified] = useState(false);
  const [knowledgeEntries, setKnowledgeEntries] = useState<KnowledgeEntry[]>([]);
  const [generatedPrompts, setGeneratedPrompts] = useState<GeneratedPrompt[]>([]);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');

  // Load from localStorage on init
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedEntries = localStorage.getItem('jarvis-knowledge-entries');
    if (savedEntries) {
      try {
        const parsed = JSON.parse(savedEntries) as KnowledgeEntry[];
        setKnowledgeEntries(
          parsed.map((e) => ({ ...e, createdAt: new Date(e.createdAt) })),
        );
      } catch (e) {
        console.error('Failed to load knowledge entries', e);
      }
    }

    const savedPrompts = localStorage.getItem('jarvis-generated-prompts');
    if (savedPrompts) {
      try {
        const parsed = JSON.parse(savedPrompts) as GeneratedPrompt[];
        setGeneratedPrompts(
          parsed.map((p) => ({ ...p, createdAt: new Date(p.createdAt) })),
        );
      } catch (e) {
        console.error('Failed to load generated prompts', e);
      }
    }

    const savedTheme = localStorage.getItem('jarvis-theme') as
      | 'light'
      | 'dark'
      | 'system'
      | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(
      'jarvis-knowledge-entries',
      JSON.stringify(knowledgeEntries),
    );
  }, [knowledgeEntries]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(
      'jarvis-generated-prompts',
      JSON.stringify(generatedPrompts),
    );
  }, [generatedPrompts]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('jarvis-theme', theme);
    // Apply theme to document
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      // system theme - follow prefers-color-scheme
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [theme]);

  const addKnowledgeEntry = (entry: KnowledgeEntry) => {
    setKnowledgeEntries((prev) => [entry, ...prev]);
  };

  const updateKnowledgeEntry = (id: string, entry: KnowledgeEntry) => {
    setKnowledgeEntries((prev) =>
      prev.map((item) => (item.id === id ? entry : item)),
    );
  };

  const deleteKnowledgeEntry = (id: string) => {
    setKnowledgeEntries((prev) => prev.filter((item) => item.id !== id));
  };

  const addGeneratedPrompt = (prompt: GeneratedPrompt) => {
    setGeneratedPrompts((prev) => [prompt, ...prev]);
  };

  const clearHistory = () => {
    setGeneratedPrompts([]);
  };

  return (
    <JarvisContext.Provider
      value={{
        isPasswordVerified,
        setPasswordVerified,
        knowledgeEntries,
        addKnowledgeEntry,
        updateKnowledgeEntry,
        deleteKnowledgeEntry,
        generatedPrompts,
        addGeneratedPrompt,
        clearHistory,
        theme,
        setTheme,
      }}
    >
      {children}
    </JarvisContext.Provider>
  );
}

export function useJarvis() {
  const context = useContext(JarvisContext);
  if (context === undefined) {
    throw new Error('useJarvis must be used within a JarvisProvider');
  }
  return context;
}
