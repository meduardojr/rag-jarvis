'use client';

import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ModelSelectorProps {
  agent: string | null;
  value: string;
  onValueChange: (value: string) => void;
  models: { id: string; name: string; tier: 'free' | 'paid' }[];
  agentModelMap: Record<string, string[]>;
}

export function ModelSelector({
  agent,
  value,
  onValueChange,
  models,
  agentModelMap,
}: ModelSelectorProps) {
  const availableModels = agent ? agentModelMap[agent] || [] : [];
  const filteredModels = models.filter((model) => availableModels.includes(model.id));

  return (
    <Select
      value={value}
      onValueChange={onValueChange}
      disabled={!agent || filteredModels.length === 0}
    >
      <SelectTrigger className="w-full glass-panel-hover">
        <SelectValue placeholder="Select model" />
      </SelectTrigger>
      <SelectContent className="w-full glass-panel">
        {filteredModels.map((model) => (
          <SelectItem key={model.id} value={model.id}>
            <div className="flex items-center gap-2">
              <span>{model.name}</span>
              {model.tier === 'paid' && (
                <span className="text-xs text-amber-600 dark:text-amber-400">
                  (Paid)
                </span>
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}