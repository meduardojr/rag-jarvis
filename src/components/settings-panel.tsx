'use client';

import { useState } from 'react';
import {
  Lock,
  Bot,
  Download,
  Upload,
  RotateCcw,
  Sparkles,
  Check,
  Sliders,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useJarvis } from '@/lib/jarvis-provider';

const MODELS = [
  { id: 'gemini-flash', name: 'Gemini Flash', tier: 'free' },
  { id: 'groq-llama3', name: 'Groq Llama3 70B', tier: 'free' },
  { id: 'groq-mixtral', name: 'Groq Mixtral 8x7B', tier: 'free' },
  { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', tier: 'paid' },
  { id: 'gpt-4o', name: 'GPT-4o', tier: 'paid' },
  { id: 'deepseek-chat', name: 'DeepSeek Chat', tier: 'paid' },
  { id: 'qwen-flash', name: 'Qwen Flash', tier: 'paid' },
] as const;

export function SettingsPanel() {
  const { setPasswordVerified, theme, setTheme } = useJarvis();
  const [password, setPassword] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [defaultModel, setDefaultModel] = useState('gemini-flash');
  const [autoPickThreshold, setAutoPickThreshold] = useState(90);
  const [minSampleSize, setMinSampleSize] = useState([5]);
  const [sessionTimeout, setSessionTimeout] = useState(30);

  const selectedModel = MODELS.find((m) => m.id === defaultModel);
  const isPaidDefault = selectedModel?.tier === 'paid';

  const handleVerifyPassword = async () => {
    if (!password.trim()) {
      toast.error('Please enter password');
      return;
    }

    setIsVerifying(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      if (password === 'jarvis123') {
        setIsVerified(true);
        setPasswordVerified(true);
        toast.success('Password verified for this session!');
      } else {
        toast.error('Incorrect password (hint: try "jarvis123")');
      }
    } catch {
      toast.error('Verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResetSettings = () => {
    setDefaultModel('gemini-flash');
    setAutoPickThreshold(90);
    setMinSampleSize([5]);
    setSessionTimeout(30);
    setTheme('system');
    toast.success('Settings reset to defaults');
  };

  const handleExport = () => {
    toast.info('Export feature coming in Phase 3 of the roadmap');
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground/90">Settings</h2>
        <p className="text-sm text-muted-foreground">
          Configure your JARVIS experience
        </p>
      </div>

      {/* Password Verification */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-indigo-500" />
          <h3 className="text-sm font-semibold text-foreground/90">Security</h3>
        </div>
        <div className="space-y-2">
          <Input
            type="password"
            placeholder="Enter password (hint: jarvis123)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleVerifyPassword()}
            className="glass-panel-hover"
          />
          <Button
            onClick={handleVerifyPassword}
            disabled={isVerifying}
            className="w-full ai-primary"
            size="sm"
          >
            {isVerifying ? (
              <>
                <Lock className="h-4 w-4 mr-2 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <Lock className="h-4 w-4 mr-2" />
                Verify Password
              </>
            )}
          </Button>
          {isVerified ? (
            <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
              <Check className="h-3 w-3" /> Verified for this session
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Required for: editing knowledge base & using paid models
            </p>
          )}
        </div>
      </div>

      {/* Model Settings */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-indigo-500" />
          <h3 className="text-sm font-semibold text-foreground/90">Default Model</h3>
        </div>
        <Select value={defaultModel} onValueChange={setDefaultModel}>
          <SelectTrigger className="w-full glass-panel-hover">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="w-full glass-panel">
            {MODELS.map((model) => (
              <SelectItem key={model.id} value={model.id}>
                <div className="flex items-center gap-2">
                  <span>{model.name}</span>
                  <Badge
                    variant={model.tier === 'paid' ? 'secondary' : 'outline'}
                    className="text-xs"
                  >
                    {model.tier}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {isPaidDefault && (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            ⚠️ Paid default — password required on first use
          </p>
        )}
      </div>

      {/* Appearance */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-indigo-500" />
          <h3 className="text-sm font-semibold text-foreground/90">Appearance</h3>
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="dark-mode" className="text-sm">
            Dark mode
          </Label>
          <Switch
            id="dark-mode"
            checked={theme === 'dark'}
            onCheckedChange={(checked: boolean) =>
              setTheme(checked ? 'dark' : 'light')
            }
          />
        </div>
      </div>

      {/* Advanced Preferences */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Sliders className="h-4 w-4 text-indigo-500" />
          <h3 className="text-sm font-semibold text-foreground/90">
            Branching Preferences
          </h3>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Auto-pick threshold</Label>
            <span className="text-xs font-mono">{autoPickThreshold}%</span>
          </div>
          <Slider
            value={[autoPickThreshold]}
            onValueChange={(value: number[]) => setAutoPickThreshold(value[0] ?? 90)}
            min={70}
            max={95}
            step={5}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Min sample size</Label>
            <span className="text-xs font-mono">{minSampleSize[0]}</span>
          </div>
          <Slider
            value={minSampleSize}
            onValueChange={(value: number[]) => setMinSampleSize(value)}
            min={3}
            max={10}
            step={1}
            className="w-full"
          />
        </div>
      </div>

      {/* Session */}
      <div className="space-y-2">
        <Label className="text-xs">Session timeout (minutes)</Label>
        <Input
          type="number"
          min={5}
          max={120}
          value={sessionTimeout}
          onChange={(e) => setSessionTimeout(parseInt(e.target.value) || 30)}
          className="glass-panel-hover"
        />
      </div>

      {/* Actions */}
      <div className="border-t pt-4 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="glass-panel-hover"
          >
            <Download className="h-3.5 w-3.5 mr-1" /> Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => toast.info('Import coming soon')}
            className="glass-panel-hover"
          >
            <Upload className="h-3.5 w-3.5 mr-1" /> Import
          </Button>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleResetSettings}
          className="w-full text-xs text-muted-foreground hover:text-foreground"
        >
          <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset to defaults
        </Button>
      </div>
    </div>
  );
}
