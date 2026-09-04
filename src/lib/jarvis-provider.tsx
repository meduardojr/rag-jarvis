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
  logout: () => void;
  refreshData: () => Promise<void>;
}

const JarvisContext = createContext<JarvisContextType | undefined>(undefined);

export function JarvisProvider({ children }: { children: ReactNode }) {
  const [isPasswordVerified, setPasswordVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [knowledgeEntries, setKnowledgeEntries] = useState<Array<any>>([]);
  const [generatedPrompts, setGeneratedPrompts] = useState<Array<any>>([]);
  const [theme, setThemeState] = useState<'light' | 'dark' | 'system'>('system');

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await Promise.all([
        loadKnowledgeEntries(),
        loadGeneratedPrompts(),
        loadTheme(),
      ]);
    } catch (err) {
      setError('Failed to connect to database. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadKnowledgeEntries = async () => {
    try {
      const response = await fetch('/api/knowledge-entries');
      if (response.ok) {
        const data = await response.json();
        setKnowledgeEntries(data);
      } else {
        console.error('Failed to load knowledge entries');
      }
    } catch (err) {
      console.error('Error loading knowledge entries:', err);
      throw err;
    }
  };

  const loadGeneratedPrompts = async () => {
    try {
      const response = await fetch('/api/generated-prompts');
      if (response.ok) {
        const data = await response.json();
        setGeneratedPrompts(data);
      } else {
        console.error('Failed to load generated prompts');
      }
    } catch (err) {
      console.error('Error loading generated prompts:', err);
      throw err;
    }
  };

  const loadTheme = async () => {
    try {
      const response = await fetch('/api/settings');
      if (response.ok) {
        const data = await response.json();
        setThemeState(data.theme);
      } else {
        console.error('Failed to load theme');
      }
    } catch (err) {
      console.error('Error loading theme:', err);
      throw err;
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
      if (response.ok) {
        setPasswordVerified(true);
        return true;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Password verification failed');
      }
    } catch (error) {
      console.error('Error verifying password:', error);
      return false;
    }
  };

  const logout = () => {
    document.cookie = 'jarvis-session=; Max-Age=0; Path=/;';
    setPasswordVerified(false);
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
      body: JSON.stringify(prompt),
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
