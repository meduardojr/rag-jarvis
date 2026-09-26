'use client';

import { useState } from 'react';
import {
  Plus,
  Trash2,
  Edit,
  Upload,
  Check,
  X,
  FileText,
  Lock,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const CATEGORIES = [
  'Stack',
  'Architecture Pattern',
  'Convention',
  'Anti-pattern/Avoid',
  'Tooling',
  'Project-specific',
] as const;

interface KnowledgeBaseListProps {
  knowledgeEntries: Array<any>;
  totalEntries: number;
  currentPage: number;
  pageSize: number;
  nextPage: () => void;
  prevPage: () => void;
  isPasswordVerified: boolean;
  isAdding: boolean;
  editingEntries: Record<string, boolean>;
  editingCategories: Record<string, string>;
  setEditingEntries: (value: React.SetStateAction<Record<string, boolean>>) => void;
  setEditingCategories: (value: React.SetStateAction<Record<string, string>>) => void;
  handleUpdateEntry: (entryId: string) => Promise<void>;
  handleDeleteEntry: (id: string) => Promise<void>;
  handleEditEntry: (entryId: string) => void;
  handleCancelEdit: (entryId: string) => void;
  handleAddTag: (entryId: string) => void;
  handleRemoveTag: (tagToRemove: string) => void;
  handleTagInputKeyDown: (e: React.KeyboardEvent<HTMLInputElement>, entryId: string) => void;
  getPendingTags: () => string[];
}

export function KnowledgeBaseList({
  knowledgeEntries,
  totalEntries,
  currentPage,
  pageSize,
  nextPage,
  prevPage,
  isPasswordVerified,
  isAdding,
  editingEntries,
  editingCategories,
  setEditingEntries,
  setEditingCategories,
  handleUpdateEntry,
  handleDeleteEntry,
  handleEditEntry,
  handleCancelEdit,
  handleAddTag,
  handleRemoveTag,
  handleTagInputKeyDown,
  getPendingTags,
}: KnowledgeBaseListProps) {
  const totalPages = Math.max(Math.ceil(totalEntries / pageSize), 1);

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground/90">
          Knowledge Base
        </h2>
        <p className="text-sm text-muted-foreground">
          View your knowledge entries (paginated, {totalEntries} total)
        </p>
        {!isPasswordVerified && (
          <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300 mb-4">
            <Lock className="h-3.5 w-3.5 shrink-0" />
            <span>
              🔒 Knowledge base is locked. Verify your password in Settings to view actual entries.
            </span>
          </div>
        )}
      </div>

      {knowledgeEntries.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            No knowledge entries yet. Add some entries to get started.
          </p>
        </div>
      ) : (
        <>
          {/* Entries List */}
          <div className="space-y-4">
            {knowledgeEntries.map((entry) => (
              <div
                key={entry.id}
                className="glass-panel p-4 rounded-lg border border-indigo-100/20 dark:border-indigo-900/20"
              >
                {editingEntries[entry.id] ? (
                  // Inline editing form
                  <div className="space-y-3">
                    <Input
                      id={`title-${entry.id}`}
                      defaultValue={entry.title}
                      className="glass-panel-hover"
                    />

                    <Textarea
                      id={`content-${entry.id}`}
                      defaultValue={entry.content}
                      rows={3}
                      className="glass-panel-hover"
                    />

                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Select
                          value={editingCategories[entry.id] ?? entry.category}
                          onValueChange={(v) =>
                            setEditingCategories(prev => ({ ...prev, [entry.id]: v }))
                          }
                        >
                          <SelectTrigger className="glass-panel-hover">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="glass-panel">
                            {CATEGORIES.map((cat) => (
                              <SelectItem key={cat} value={cat}>
                                {cat}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <div className="flex gap-2">
                          <Input
                            id={`tag-input-${entry.id}`}
                            placeholder="Add tags..."
                            onKeyDown={(e) => handleTagInputKeyDown(e, entry.id)}
                            className="glass-panel-hover"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => handleAddTag(entry.id)}
                            className="glass-panel-hover shrink-0"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {entry.tags && entry.tags.length > 0 && (
                        <div id={`tags-display-${entry.id}`} className="flex flex-wrap gap-2 mt-2">
                          {entry.tags.map((tag: string) => (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="flex items-center gap-1 pl-3 pr-2 py-1"
                            >
                              {tag}
                              <button
                                type="button"
                                onClick={() => handleRemoveTag(tag)}
                                className="ml-1 h-4 w-4 rounded-full hover:bg-accent flex items-center justify-center"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        onClick={() => handleUpdateEntry(entry.id)}
                        disabled={isAdding || !isPasswordVerified}
                        className="flex-1 ai-primary"
                      >
                        {isAdding ? (
                          <>
                            <Check className="h-4 w-4 mr-2 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            Update Entry
                          </>
                        )}
                      </Button>

                      <Button
                        variant="outline"
                        onClick={() => handleCancelEdit(entry.id)}
                        className="glass-panel-hover"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  // Display mode
                  <>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-indigo-600 dark:text-indigo-300 truncate">
                          {isPasswordVerified ? entry.title : '•••••••'}
                        </h4>
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <Badge variant="outline" className="text-xs">
                            {isPasswordVerified ? entry.category : '•••••••'}
                          </Badge>
                          <span>
                            {entry.created_at ? new Date(entry.created_at).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1 ml-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditEntry(entry.id)}
                          disabled={!isPasswordVerified}
                          className="h-8 w-8"
                        >
                          <Edit className="h-4 w-4 text-indigo-500 hover:text-indigo-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteEntry(entry.id)}
                          disabled={!isPasswordVerified}
                          className="h-8 w-8"
                        >
                          <Trash2 className="h-4 w-4 text-indigo-500 hover:text-indigo-600" />
                        </Button>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {isPasswordVerified ? entry.content.substring(0, 100) : ''}
                      {entry.content.length > 100 && isPasswordVerified ? '...' : ''}
                    </p>

                    {entry.tags && entry.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {entry.tags.map((tag: string) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {isPasswordVerified ? tag : '•••••••'}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between px-4 py-2 text-sm">
            <button
              onClick={prevPage}
              disabled={currentPage === 1}
              className={`flex-1 px-3 py-1.5 rounded-md ${currentPage === 1 ? 'opacity-25' : ''} hover:opacity-100`}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-center flex-1">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={nextPage}
              disabled={currentPage === totalPages}
              className={`flex-1 px-3 py-1.5 rounded-md ${currentPage === totalPages ? 'opacity-25' : ''} hover:opacity-100`}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}