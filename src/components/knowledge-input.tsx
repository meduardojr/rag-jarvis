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
import { useJarvis } from '@/lib/jarvis-provider';

const CATEGORIES = [
  'Stack',
  'Architecture Pattern',
  'Convention',
  'Anti-pattern/Avoid',
  'Tooling',
  'Project-specific',
] as const;

export function KnowledgeInput() {
  const {
    isPasswordVerified,
    knowledgeEntries,
    totalEntries,
    currentPage,
    pageSize,
    nextPage,
    prevPage,
    addKnowledgeEntry,
    updateKnowledgeEntry,
    deleteKnowledgeEntry,
  } = useJarvis();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<string>('Stack');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  // For inline editing, we'll store the editing state per entry
  const [editingEntries, setEditingEntries] = useState<Record<string, boolean>>({});

  const getPendingTags = () => Array.from(new Set([
    ...tags,
    ...tagInput.split(',').map((tag) => tag.trim()).filter(Boolean),
  ]));

  const handleAddEntry = async () => {
    if (!isPasswordVerified) {
      toast.error('Verify your password in Settings before adding an entry');
      return;
    }

    if (!title.trim() || !content.trim()) {
      toast.error('Please fill in title and content');
      return;
    }

    setIsAdding(true);
    try {
      const newEntry = {
        title,
        content,
        category,
        tags: getPendingTags(),
      };

      await addKnowledgeEntry(newEntry);
      resetForm();
      toast.success('Knowledge entry added successfully!');
    } catch (error: any) {
      console.error('Error adding knowledge entry:', error);
      toast.error(error.message || 'Failed to add knowledge entry');
    } finally {
      setIsAdding(false);
    }
  };

  const handleUpdateEntry = async (entryId: string) => {
    if (!isPasswordVerified) {
      toast.error('Verify your password in Settings before updating an entry');
      return;
    }

    const titleInput = document.getElementById(`title-${entryId}`) as HTMLInputElement;
    const contentInput = document.getElementById(`content-${entryId}`) as HTMLTextAreaElement;
    const categoryInput = document.getElementById(`category-${entryId}`) as HTMLSelectElement;
    const tagInputEl = document.getElementById(`tag-input-${entryId}`) as HTMLInputElement;
    const tagsDisplay = document.getElementById(`tags-display-${entryId}`) as HTMLDivElement;

    if (!titleInput || !contentInput || !categoryInput) {
      toast.error('Failed to access form elements');
      return;
    }

    const entryTitle = titleInput.value.trim();
    const entryContent = contentInput.value.trim();
    const entryCategory = categoryInput.value;
    const entryTags = Array.from(new Set([
      ...tags,
      ...tagInputEl.value.split(',').map((tag) => tag.trim()).filter(Boolean),
    ]));

    if (!entryTitle || !entryContent) {
      toast.error('Please fill in title and content');
      return;
    }

    try {
      const existingEntry = knowledgeEntries.find((e) => e.id === entryId);
      if (!existingEntry) throw new Error('Entry not found');

      await updateKnowledgeEntry(entryId, {
        ...existingEntry,
        title: entryTitle,
        content: entryContent,
        category: entryCategory,
        tags: entryTags,
      });

      // Exit editing mode
      setEditingEntries(prev => {
        const newState = {...prev};
        delete newState[entryId];
        return newState;
      });
      
      toast.success('Knowledge entry updated successfully!');
    } catch (error: any) {
      console.error('Error updating knowledge entry:', error);
      toast.error(error.message || 'Failed to update knowledge entry');
    }
  };

  const handleDeleteEntry = async (id: string) => {
    if (!isPasswordVerified) {
      toast.error('Verify your password in Settings before deleting an entry');
      return;
    }

    try {
      await deleteKnowledgeEntry(id);
      // Remove from editing state if it was being edited
      setEditingEntries(prev => {
        const newState = {...prev};
        delete newState[id];
        return newState;
      });
      toast.success('Entry deleted');
    } catch (error: any) {
      console.error('Error deleting knowledge entry:', error);
      toast.error(error.message || 'Failed to delete entry');
    }
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setCategory('Stack');
    setTags([]);
    setTagInput('');
  };

  const handleEditEntry = (entryId: string) => {
    setEditingEntries(prev => ({
      ...prev,
      [entryId]: true
    }));
  };

  const handleCancelEdit = (entryId: string) => {
    setEditingEntries(prev => {
      const newState = {...prev};
      delete newState[entryId];
      return newState;
    });
  };

  const handleAddTag = (entryId: string) => {
    const tagInputEl = document.getElementById(`tag-input-${entryId}`) as HTMLInputElement;
    if (tagInputEl) {
      const nextTags = getPendingTags();
      setTags(nextTags);
      tagInputEl.value = '';
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, entryId: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag(entryId);
    }
  };

  const totalPages = Math.max(Math.ceil(totalEntries / pageSize), 1);

  return (
    <div className="space-y-6">
      {/* Add Entry Form (always visible) */}
      <div className="space-y-4">
        <div className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground/90">
            Add Knowledge Entry
          </h2>
          <p className="text-sm text-muted-foreground">
            Capture your technical knowledge, preferences, and conventions
          </p>
          {!isPasswordVerified && (
            <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
              <Lock className="h-3.5 w-3.5 shrink-0" />
              Verify your password in Settings to add or modify entries.
            </div>
          )}
        </div>

        <div className="space-y-4">
          <Input
            placeholder="Entry title (e.g., 'Backend Stack', 'React Architecture')"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="glass-panel-hover"
          />

          <Textarea
            placeholder="Describe your knowledge, preferences, conventions, etc."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            className="glass-panel-hover"
          />

          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full glass-panel-hover">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent className="w-full glass-panel">
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                id="tag-input-add-form"
                placeholder="Tags separated by commas (e.g., frontend, backend, database)"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => handleTagInputKeyDown(e, 'add-form')}
                className="glass-panel-hover"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => handleAddTag('add-form')}
                className="glass-panel-hover shrink-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
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
              onClick={() => {
                toast.info('File upload feature coming soon!');
              }}
              className="glass-panel-hover"
            >
              <Upload className="h-4 w-4 mr-2" /> Upload File
            </Button>

            <Button
              onClick={handleAddEntry}
              disabled={isAdding || !isPasswordVerified}
              className="flex-1 ai-primary"
            >
              {isAdding ? (
                <>
                  <Check className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : !isPasswordVerified ? (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Password Required
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Entry
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Knowledge Entries List (always visible) */}
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
            <div className={`space-y-4 ${!isPasswordVerified ? 'opacity-50' : ''}`}>
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
                        onChange={(e) => { /* We'll read the value directly on submit */ }}
                        className="glass-panel-hover"
                      />
                      
                      <Textarea
                        id={`content-${entry.id}`}
                        defaultValue={entry.content}
                        onChange={(e) => { /* We'll read the value directly on submit */ }}
                        rows={3}
                        className="glass-panel-hover"
                      />
                      
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Select
                            id={`category-${entry.id}`}
                            defaultValue={entry.category}
                            onValueChange={(v) => { /* We'll read the value directly on submit */ }}
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
                            {entry.tags.map((tag) => (
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
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-indigo-600 dark:text-indigo-300 truncate">
                          {entry.title}
                        </h4>
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <Badge variant="outline" className="text-xs">
                            {entry.category}
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
                  )}
                  
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {entry.content.substring(0, 100)}
                    {entry.content.length > 100 ? '...' : ''}
                  </p>
                  
                  {entry.tags && entry.tags.length > 0 && (
                                                        <div className="flex flex-wrap gap-1 mt-2">
                                                          {entry.tags.map((tag: string) => (
                                                            <Badge key={tag} variant="secondary" className="text-xs">
                                                              {tag}
                                                            </Badge>
                                                          ))}
                                                        </div>
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
    </div>
  );
}