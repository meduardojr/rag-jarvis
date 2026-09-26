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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useJarvis } from '@/lib/jarvis-provider';
import { AddEntryForm } from '@/components/add-entry-form';
import { KnowledgeBaseList } from '@/components/knowledge-base-list';

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
  // Category is controlled via React state per entry, since the Select
  // component doesn't render a native <select> with an id we can read from the DOM.
  const [editingCategories, setEditingCategories] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'add' | 'list'>('add');

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
    const tagInputEl = document.getElementById(`tag-input-${entryId}`) as HTMLInputElement;
    const tagsDisplay = document.getElementById(`tags-display-${entryId}`) as HTMLDivElement;

    if (!titleInput || !contentInput) {
      toast.error('Failed to access form elements');
      return;
    }

    const entryTitle = titleInput.value.trim();
    const entryContent = contentInput.value.trim();
    const entryCategory =
      editingCategories[entryId] ||
      knowledgeEntries.find((e) => e.id === entryId)?.category ||
      'Stack';
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
      setEditingCategories(prev => {
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
      setEditingCategories(prev => {
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
    const entry = knowledgeEntries.find((e) => e.id === entryId);
    setEditingCategories(prev => ({
      ...prev,
      [entryId]: entry?.category || 'Stack',
    }));
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
    setEditingCategories(prev => {
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
    <div className="space-y-4">
      <Tabs defaultValue="add" onValueChange={(value) => setActiveTab(value as 'add' | 'list')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="add" className="flex flex-1 items-center justify-center px-2 h-10 text-sm font-semibold rounded-border border-muted background/60 hover:bg-accent/50 data-[state=active]:background-accent data-[state=active]:foreground-accent-foreground transition-colors">
            <Plus className="mr-2 h-4 w-4" />
            Add Entry
          </TabsTrigger>
          <TabsTrigger value="list" className="flex flex-1 items-center justify-center px-2 h-10 text-sm font-semibold rounded-border border-muted background/60 hover:bg-accent/50 data-[state=active]:background-accent data-[state=active]:foreground-accent-foreground transition-colors">
            <FileText className="mr-2 h-4 w-4" />
            Knowledge Base
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="add" className="mt-4">
          <AddEntryForm
            isPasswordVerified={isPasswordVerified}
            isAdding={isAdding}
            title={title}
            content={content}
            category={category}
            tags={tags}
            tagInput={tagInput}
            setTitle={setTitle}
            setContent={setContent}
            setCategory={setCategory}
            setTags={setTags}
            setTagInput={setTagInput}
            getPendingTags={getPendingTags}
            handleAddEntry={handleAddEntry}
            resetForm={resetForm}
            handleTagInputKeyDown={handleTagInputKeyDown}
          />
        </TabsContent>
        
        <TabsContent value="list" className="mt-4">
          <KnowledgeBaseList
            knowledgeEntries={knowledgeEntries}
            totalEntries={totalEntries}
            currentPage={currentPage}
            pageSize={pageSize}
            nextPage={nextPage}
            prevPage={prevPage}
            isPasswordVerified={isPasswordVerified}
            isAdding={isAdding}
            editingEntries={editingEntries}
            editingCategories={editingCategories}
            setEditingEntries={setEditingEntries}
            setEditingCategories={setEditingCategories}
            handleUpdateEntry={handleUpdateEntry}
            handleDeleteEntry={handleDeleteEntry}
            handleEditEntry={handleEditEntry}
            handleCancelEdit={handleCancelEdit}
            handleAddTag={handleAddTag}
            handleRemoveTag={handleRemoveTag}
            handleTagInputKeyDown={handleTagInputKeyDown}
            getPendingTags={getPendingTags}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}