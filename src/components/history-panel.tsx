'use client';

import { useState } from 'react';
import {
  Clock,
  Copy,
  Trash2,
  RotateCw,
  Sparkles,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useJarvis } from '@/lib/jarvis-provider';

export function HistoryPanel() {
  const { generatedPrompts, clearHistory } = useJarvis();
  const [searchTerm, setSearchTerm] = useState('');
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);

  const filteredHistory = generatedPrompts
    .filter(
      (item) =>
        item.query.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.targetTool.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleCopyPrompt = async (prompt: string) => {
    try {
      await navigator.clipboard.writeText(prompt);
      toast.success('Prompt copied to clipboard!');
    } catch {
      toast.error('Failed to copy prompt');
    }
  };

  const handleRegenerate = async (id: string) => {
    setRegeneratingId(id);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success('Regenerate with current knowledge base!');
    } catch {
      toast.error('Failed to regenerate');
    } finally {
      setRegeneratingId(null);
    }
  };

  const handleDeleteHistory = (id: string) => {
    toast.success('History item removed');
  };

  const handleClearHistory = () => {
    clearHistory();
    toast.success('History cleared');
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground/90">History</h2>
        <p className="text-sm text-muted-foreground">
          View and reuse your previously generated prompts
        </p>
      </div>

      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search history..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 glass-panel-hover"
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {filteredHistory.length} items
          </span>
          {generatedPrompts.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearHistory}
              className="text-xs h-7 px-2 text-muted-foreground hover:text-destructive"
            >
              Clear all
            </Button>
          )}
        </div>
      </div>

      {filteredHistory.length === 0 ? (
        <div className="text-center py-8 space-y-3">
          <Clock className="h-8 w-8 mx-auto text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">No history yet</p>
          <Button variant="outline" size="sm" className="glass-panel-hover">
            <Sparkles className="h-4 w-4 mr-2" /> Generate your first prompt
          </Button>
        </div>
      ) : (
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
          {filteredHistory.map((item) => (
            <div
              key={item.id}
              className="glass-panel p-3 rounded-lg border border-indigo-100/20 dark:border-indigo-900/20 space-y-2"
            >
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1 min-w-0 space-y-1">
                  <h3 className="font-medium text-sm text-indigo-600 dark:text-indigo-300 line-clamp-1">
                    {item.query}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <Badge variant="outline" className="text-xs">
                      {item.targetTool}
                    </Badge>
                    <Badge
                      variant={item.isPaid ? 'secondary' : 'outline'}
                      className={`text-xs ${item.isPaid ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' : 'text-green-600'}`}
                    >
                      {item.isPaid ? 'Paid' : 'Free'}
                    </Badge>
                    <span className="text-muted-foreground">
                      {formatTimeAgo(item.createdAt)}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleCopyPrompt(item.generatedOutput)}
                    className="h-8 w-8"
                  >
                    <Copy className="h-3.5 w-3.5 text-indigo-500 hover:text-indigo-600" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRegenerate(item.id)}
                    disabled={regeneratingId === item.id}
                    className="h-8 w-8"
                  >
                    <RotateCw
                      className={`h-3.5 w-3.5 text-indigo-500 hover:text-indigo-600 ${
                        regeneratingId === item.id ? 'animate-spin' : ''
                      }`}
                    />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteHistory(item.id)}
                    className="h-8 w-8"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-indigo-500 hover:text-indigo-600" />
                  </Button>
                </div>
              </div>

              <p className="text-xs text-muted-foreground line-clamp-2 font-mono">
                {item.generatedOutput.substring(0, 120)}
                {item.generatedOutput.length > 120 ? '...' : ''}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
