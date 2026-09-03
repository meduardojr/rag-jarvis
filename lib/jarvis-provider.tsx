import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface JarvisContextType {
  isPasswordVerified: boolean;
  setPasswordVerified: (verified: boolean) => void;
  knowledgeEntries: Array<any>;
  addKnowledgeEntry: (entry: any) => void;
  updateKnowledgeEntry: (id: string, entry: any) => void;
  deleteKnowledgeEntry: (id: string) => void;
  generatedPrompts: Array<any>;
  addGeneratedPrompt: (prompt: any) => void;
  clearHistory: () => void;
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

const JarvisContext = createContext<JarvisContextType | undefined>(undefined);

export function JarvisProvider({ children }: { children: ReactNode }) {
  const [isPasswordVerified, setPasswordVerified] = useState(false);
  const [knowledgeEntries, setKnowledgeEntries] = useState<Array<any>>([]);
  const [generatedPrompts, setGeneratedPrompts] = useState<Array<any>>([]);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');

  // Load from localStorage on init
  useEffect(() => {
    const savedEntries = localStorage.getItem('jarvis-knowledge-entries');
    if (savedEntries) {
      try {
        setKnowledgeEntries(JSON.parse(savedEntries));
      } catch (e) {
        console.error('Failed to load knowledge entries', e);
      }
    }

    const savedPrompts = localStorage.getItem('jarvis-generated-prompts');
    if (savedPrompts) {
      try {
        setGeneratedPrompts(JSON.parse(savedPrompts));
      } catch (e) {
        console.error('Failed to load generated prompts', e);
      }
    }

    const savedTheme = localStorage.getItem('jarvis-theme') as 'light' | 'dark' | 'system' | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem('jarvis-knowledge-entries', JSON.stringify(knowledgeEntries));
  }, [knowledgeEntries]);

  useEffect(() => {
    localStorage.setItem('jarvis-generated-prompts', JSON.stringify(generatedPrompts));
  }, [generatedPrompts]);

  useEffect(() => {
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

  const addKnowledgeEntry = (entry: any) => {
    setKnowledgeEntries(prev => [entry, ...prev]);
  };

  const updateKnowledgeEntry = (id: string, entry: any) => {
    setKnowledgeEntries(prev => 
      prev.map(item => item.id === id ? entry : item)
    );
  };

  const deleteKnowledgeEntry = (id: string) => {
    setKnowledgeEntries(prev => prev.filter(item => item.id !== id));
  };

  const addGeneratedPrompt = (prompt: any) => {
    setGeneratedPrompts(prev => [prompt, ...prev]);
  };

  const clearHistory = () => {
    setGeneratedPrompts([]);
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
      setTheme
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