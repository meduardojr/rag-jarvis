'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface JarvisContextType {
  isPasswordVerified: boolean;
  setPasswordVerified: (verified: boolean) => void;
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
}

const JarvisContext = createContext<JarvisContextType | undefined>(undefined);

export function JarvisProvider({ children }: { children: ReactNode }) {
  const [isPasswordVerified, setPasswordVerified] = useState(false);
  const [knowledgeEntries, setKnowledgeEntries] = useState<Array<any>>([]);
  const [generatedPrompts, setGeneratedPrompts] = useState<Array<any>>([]);
  const [theme, setThemeState] = useState<'light' | 'dark' | 'system'>('system');

  // Load data from API on init
  useEffect(() => {
    loadKnowledgeEntries();
    loadGeneratedPrompts();
    loadTheme();
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
    } catch (error) {
      console.error('Error loading knowledge entries:', error);
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
    } catch (error) {
      console.error('Error loading generated prompts:', error);
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
    } catch (error) {
      console.error('Error loading theme:', error);
    }
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
    // Clear the session cookie by setting it to expire
    document.cookie = 'jarvis-session=; Max-Age=0; Path=/;';
    setPasswordVerified(false);
  };

  const addKnowledgeEntry = async (entry: any) => {
    try {
      const response = await fetch('/api/knowledge-entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entry),
      });
      if (response.ok) {
        const data = await response.json();
        await loadKnowledgeEntries(); // Reload the list
        return data;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add knowledge entry');
      }
    } catch (error) {
      console.error('Error adding knowledge entry:', error);
      throw error;
    }
  };

  const updateKnowledgeEntry = async (id: string, entry: any) => {
    try {
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
    } catch (error) {
      console.error('Error updating knowledge entry:', error);
      throw error;
    }
  };

  const deleteKnowledgeEntry = async (id: string) => {
    try {
      const response = await fetch(`/api/knowledge-entries?id=${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        await loadKnowledgeEntries();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete knowledge entry');
      }
    } catch (error) {
      console.error('Error deleting knowledge entry:', error);
      throw error;
    }
  };

  const addGeneratedPrompt = async (prompt: any) => {
    try {
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
    } catch (error) {
      console.error('Error adding generated prompt:', error);
      throw error;
    }
  };

  const clearHistory = async () => {
    try {
      const response = await fetch('/api/generated-prompts', {
        method: 'DELETE',
      });
      if (response.ok) {
        await loadGeneratedPrompts();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to clear history');
      }
    } catch (error) {
      console.error('Error clearing history:', error);
      throw error;
    }
  };

  const setTheme = async (theme: 'light' | 'dark' | 'system') => {
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ theme }),
      });
      if (response.ok) {
        setThemeState(theme);
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
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to set theme');
      }
    } catch (error) {
      console.error('Error setting theme:', error);
      throw error;
    }
  };

  return (
    <JarvisContext.Provider value={{
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
      verifyPassword,
      logout,
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