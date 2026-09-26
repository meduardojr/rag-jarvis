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

interface AddEntryFormProps {
  isPasswordVerified: boolean;
  isAdding: boolean;
  title: string;
  content: string;
  category: string;
  tags: string[];
  tagInput: string;
  setTitle: (title: string) => void;
  setContent: (content: string) => void;
  setCategory: (category: string) => void;
  setTags: (tags: string[]) => void;
  setTagInput: (tagInput: string) => void;
  getPendingTags: () => string[];
  handleAddEntry: () => Promise<void>;
  resetForm: () => void;
  handleTagInputKeyDown: (e: React.KeyboardEvent<HTMLInputElement>, formId: string) => void;
}

export function AddEntryForm({
  isPasswordVerified,
  isAdding,
  title,
  content,
  category,
  tags,
  tagInput,
  setTitle,
  setContent,
  setCategory,
  setTags,
  setTagInput,
  getPendingTags,
  handleAddEntry,
  resetForm,
  handleTagInputKeyDown,
}: AddEntryFormProps) {
  return (
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
              onClick={() => {
                setTags(getPendingTags());
                setTagInput('');
              }}
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
                    onClick={() => {
                      // This will be handled by parent via a callback
                    }}
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
  );
}