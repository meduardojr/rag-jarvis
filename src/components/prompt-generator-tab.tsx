'use client';


import { useState } from 'react';
import { useJarvis } from '@/lib/jarvis-provider';
import { Copy } from 'lucide-react'; 
import { Badge } from '@/components/ui/badge'; 
import { PromptGenerator } from './prompt-generator';

export function PromptGeneratorTab() {
  const { generatedPrompts } = useJarvis();
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 3;

  // Get the prompts for the current page
  const paginatedPrompts = generatedPrompts
    .slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const totalPages = Math.max(Math.ceil(generatedPrompts.length / pageSize), 1);

  return (
    <div className="space-y-6">
      {/* Prompt Generator Form */}
      <PromptGenerator />

      {/* Prompt History View (Paginated, 3 items per page) */}
      {generatedPrompts.length > 0 && (
        <div className="border-t pt-4 space-y-4">
                      <h2 className="text-xl font-semibold text-foreground/90">
                        Prompt History
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Showing {paginatedPrompts.length} of {generatedPrompts.length} prompts
                      </p>

          {/* History Items */}
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
            {paginatedPrompts.map((prompt) => (
              <div
                key={prompt.id}
                className="glass-panel p-3 rounded-lg border border-indigo-100/20 dark:border-indigo-900/20 space-y-2"
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0 space-y-1">
                    <h3 className="font-medium text-sm text-indigo-600 dark:text-indigo-300 line-clamp-1">
                      {prompt.query}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <Badge variant="outline" className="text-xs">
                        {prompt.targetTool}
                      </Badge>
                      <Badge
                        variant={prompt.isPaid ? 'secondary' : 'outline'}
                        className={`text-xs ${prompt.isPaid ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' : 'text-green-600'}`}
                      >
                        {prompt.isPaid ? 'Paid' : 'Free'}
                      </Badge>
                      <span className="text-muted-foreground">
                        {/* Format time ago */}
                        {(() => {
                          const now = new Date();
                          const diffMs = now.getTime() - new Date(prompt.createdAt).getTime();
                          const diffMins = Math.floor(diffMs / 60000);
                          const diffHours = Math.floor(diffMs / 3600000);
                          const diffDays = Math.floor(diffMs / 86400000);

                          if (diffMins < 1) return 'Just now';
                          if (diffMins < 60) return `${diffMins}m ago`;
                          if (diffHours < 24) return `${diffHours}h ago`;
                          return `${diffDays}d ago`;
                        })()}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-1 shrink-0">
                    {/* Copy button */}
                    <button
                      onClick={() => navigator.clipboard.writeText(prompt.generatedOutput)}
                      className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-indigo-50/100 transition-colors"
                    >
                      <Copy className="h-3.5 w-3.5 text-indigo-500 hover:text-indigo-600" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground line-clamp-2 font-mono">
                  {prompt.generatedOutput.substring(0, 120)}
                  {prompt.generatedOutput.length > 120 ? '...' : ''}
                </p>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-2 text-sm">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`flex-1 px-3 py-1.5 rounded-md ${currentPage === 1 ? 'opacity-25' : ''} hover:opacity-100`}
              >
                ‹ Previous
              </button>
              <span className="text-center flex-1">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className={`flex-1 px-3 py-1.5 rounded-md ${currentPage === totalPages ? 'opacity-25' : ''} hover:opacity-100`}
              >
                Next ›
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}