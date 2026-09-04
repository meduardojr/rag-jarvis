'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface JarvisContextType {
  isPasswordVerified: boolean;
  setPasswordVerified: (verified: boolean) => void;
  isLoading: boolean;
  error: string | null;
  knowledgeEntries: Array<any>;
  addKnowledgeEntry: (entry: any) => Promise<void>;
  updateKnowledgeEntry: (id: string, entry: any) => Promise<void>;
  deleteKnowledgeEntry: (id: string) => Promise<void>;
  generatedPrompts: Array<any>;
  addGeneratedPrompt: (prompt: any) => Promise<void>;
  clearHistory: () => Promise<void>;
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => Promise<void>;
  verifyPassword: (password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshData: () => Promise<void>;
}

const JarvisContext = createContext<JarvisContextType | undefined>(undefined);

export function JarvisProvider({ children }: { children: ReactNode }) {
  const [isPasswordVerified, setPasswordVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [knowledgeEntries, setKnowledgeEntries] = useState<Array<any>>([]);
  const [generatedPrompts, setGeneratedPrompts] = useState<Array<any>>([]);
  const [theme, setThemeState] = useState<'light' | 'dark' | 'system'>('system');

  const loadData = async () => {
    setIsLoading(false);
    setError(null);

    const results = await Promise.all([
      loadKnowledgeEntries(),
      loadGeneratedPrompts(),
      loadTheme(),
    ]);

    setIsLoading(!results.every(Boolean));
  };

  useEffect(() => {
    loadData();
    fetch('/api/auth/verify')
      .then((response) => response.ok ? response.json() : { verified: false })
      .then((session) => setPasswordVerified(session.verified === true))
      .catch(() => setPasswordVerified(false));
  }, []);

  const loadKnowledgeEntries = async () => {
    try {
      const response = await fetch('/api/knowledge-entries');
      if (!response.ok) return false;

      const data = await response.json();
      setKnowledgeEntries(Array.isArray(data) ? data : []);
      return true;
    } catch {
      return false;
    }
  };

  const loadGeneratedPrompts = async () => {
    try {
      const response = await fetch('/api/generated-prompts');
      if (!response.ok) return false;

      const data = await response.json();
      setGeneratedPrompts(Array.isArray(data) ? data.map((prompt) => ({
        id: prompt.id,
        query: prompt.user_query,
        targetTool: prompt.target_tool,
        modelUsed: prompt.model_used,
        modelTier: prompt.model_tier,
        isPaid: prompt.model_tier === 'paid',
        retrievedChunkIds: prompt.retrieved_chunk_ids || [],
        generatedOutput: prompt.generated_output,
        createdAt: prompt.created_at,
      })) : []);
      return true;
    } catch {
      return false;
    }
  };

  const loadTheme = async () => {
    try {
      const response = await fetch('/api/settings');
      if (!response.ok) return false;

      const data = await response.json();
      setThemeState(data?.theme || 'system');
      return true;
    } catch {
      return false;
    }
  };

  const refreshData = async () => {
    await loadData();
  };

  const verifyPassword = async (password: string) => {
    try {
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });
      if (!response.ok) return false;

      const result = await response.json();
      const verified = result?.success === true;
      setPasswordVerified(verified);
      return verified;
    } catch {
      return false;
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/verify', { method: 'DELETE' });
    } finally {
      setPasswordVerified(false);
    }
  };

  const addKnowledgeEntry = async (entry: any) => {
    const response = await fetch('/api/knowledge-entries', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(entry),
    });
    if (response.ok) {
      const data = await response.json();
      await loadKnowledgeEntries();
      return data;
    } else {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to add knowledge entry');
    }
  };

  const updateKnowledgeEntry = async (id: string, entry: any) => {
    const response = await fetch(`/api/knowledge-entries?id=${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(entry),
    });
    if (response.ok) {
      const data = await response.json();
      await loadKnowledgeEntries();
      return data;
    } else {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update knowledge entry');
    }
  };

  const deleteKnowledgeEntry = async (id: string) => {
    const response = await fetch(`/api/knowledge-entries?id=${id}`, {
      method: 'DELETE',
    });
    if (response.ok) {
      await loadKnowledgeEntries();
    } else {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete knowledge entry');
    }
  };

  const addGeneratedPrompt = async (prompt: any) => {
    const response = await fetch('/api/generated-prompts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_query: prompt.query,
        target_tool: prompt.targetTool,
        model_used: prompt.modelUsed,
        model_tier: prompt.modelTier,
        retrieved_chunk_ids: prompt.retrievedChunkIds,
        generated_output: prompt.generatedOutput,
      }),
    });
    if (response.ok) {
      const data = await response.json();
      await loadGeneratedPrompts();
      return data;
    } else {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to add generated prompt');
    }
  };

  const clearHistory = async () => {
    const response = await fetch('/api/generated-prompts', {
      method: 'DELETE',
    });
    if (response.ok) {
      await loadGeneratedPrompts();
    } else {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to clear history');
    }
  };

  const setTheme = async (theme: 'light' | 'dark' | 'system') => {
    const response = await fetch('/api/settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ theme }),
    });
    if (response.ok) {
      setThemeState(theme);
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else if (theme === 'light') {
        document.documentElement.classList.remove('dark');
      } else {
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    } else {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to set theme');
    }
  };

  return (
    <JarvisContext.Provider value={{
      isPasswordVerified,
      setPasswordVerified,
      isLoading,
      error,
      knowledgeEntries,
      addKnowledgeEntry,
      updateKnowledgeEntry,
      deleteKnowledgeEntry,
      generatedPrompts,
      addGeneratedPrompt,
      clearHistory,
      theme,
      setTheme,
      verifyPassword,
      logout,
      refreshData,
    }}>
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
