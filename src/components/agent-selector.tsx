'use client';

import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AgentSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  options: { value: string; label: string }[];
}

export function AgentSelector({
  value,
  onValueChange,
  options,
}: AgentSelectorProps) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-full glass-panel-hover">
        <SelectValue placeholder="Select agent" />
      </SelectTrigger>
      <SelectContent className="w-full glass-panel">
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            <div className="flex items-center gap-2">
              <span>{option.label}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}