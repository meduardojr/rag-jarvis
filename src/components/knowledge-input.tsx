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
  const [editingId, setEditingId] = useState<string | null>(null);

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

  const handleUpdateEntry = async () => {
    if (!isPasswordVerified) {
      toast.error('Verify your password in Settings before updating an entry');
      return;
    }

    if (!editingId || !title.trim() || !content.trim()) {
      toast.error('Please fill in title and content');
      return;
    }

    setIsAdding(true);
    try {
      const existingEntry = knowledgeEntries.find((e) => e.id === editingId);
      if (!existingEntry) throw new Error('Entry not found');

      await updateKnowledgeEntry(editingId, {
        ...existingEntry,
        title,
        content,
        category,
        tags: getPendingTags(),
      });

      setEditingId(null);
      resetForm();
      toast.success('Knowledge entry updated successfully!');
    } catch (error: any) {
      console.error('Error updating knowledge entry:', error);
      toast.error(error.message || 'Failed to update knowledge entry');
    } finally {
      setIsAdding(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setCategory('Stack');
    setTags([]);
    setTagInput('');
  };

  const handleEditEntry = (entry: typeof knowledgeEntries[0]) => {
    setTitle(entry.title);
    setContent(entry.content);
    setCategory(entry.category);
    setTags(entry.tags || []);
    setEditingId(entry.id);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    resetForm();
  };

  const handleAddTag = () => {
    const nextTags = getPendingTags();
    if (nextTags.length > tags.length) {
      setTags(nextTags);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleDeleteEntry = async (id: string) => {
    if (!isPasswordVerified) {
      toast.error('Verify your password in Settings before deleting an entry');
      return;
    }

    try {
      await deleteKnowledgeEntry(id);
      toast.success('Entry deleted');
      if (editingId === id) {
        setEditingId(null);
        resetForm();
      }
    } catch (error: any) {
      console.error('Error deleting knowledge entry:', error);
      toast.error(error.message || 'Failed to delete entry');
    }
  };

  return (
    <div className="space-y-6">
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
              placeholder="Tags separated by commas (e.g., frontend, backend, database)"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagInputKeyDown}
              className="glass-panel-hover"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleAddTag}
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

          {editingId ? (
            <div className="flex gap-2 flex-1">
              <Button
                onClick={handleUpdateEntry}
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
                onClick={handleCancelEdit}
                className="glass-panel-hover"
              >
                Cancel
              </Button>
            </div>
          ) : (
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
          )}
        </div>
      </div>

      {knowledgeEntries.length > 0 && (
        <div className="border-t pt-4 space-y-3">
          <h3 className="text-lg font-semibold text-foreground/90">
            Your Knowledge Base ({knowledgeEntries.length})
          </h3>
          <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
            {knowledgeEntries.slice(0, 5).map((entry) => (
              <div
                key={entry.id}
                className="glass-panel p-3 rounded-lg border border-indigo-100/20 dark:border-indigo-900/20"
              >
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
                      onClick={() => handleEditEntry(entry)}
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
            {knowledgeEntries.length > 5 && (
              <div className="text-center text-sm text-muted-foreground py-2">
                <FileText className="h-4 w-4 inline mr-1" />
                +{knowledgeEntries.length - 5} more entries in your knowledge base
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}