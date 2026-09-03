import { useState } from 'react';
import { 
  Button, 
  Input, 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue,
  Switch,
  Slider,
  Label
} from '@/components/ui';
import { 
  Lock, 
  Bot, 
  Sparkles, 
  Palette, 
  Moon, 
  Sun, 
  Zap, 
  TrendingUp,
  Settings,
  Upload
} from 'lucide-react';
import { toast } from 'sonner';

export function SettingsPanel() {
  const [password, setPassword] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [defaultModel, setDefaultModel] = useState('gemini-flash');
  const [theme, setTheme] = useState('system');
  const [autoPickThreshold, setAutoPickThreshold] = useState(90);
  const [minSampleSize, setMinSampleSize] = useState(5);
  const [isPaidModelWarning, setIsPaidModelWarning] = useState(false);

  const MODELS = [
    { id: 'gemini-flash', name: 'Gemini Flash', tier: 'free' },
    { id: 'groq-llama3', name: 'Groq Llama3', tier: 'free' },
    { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', tier: 'paid' },
    { id: 'gpt-4o', name: 'GPT-4o', tier: 'paid' },
    { id: 'deepseek-chat', name: 'DeepSeek Chat', tier: 'paid' },
    { id: 'qwen-flash', name: 'Qwen Flash', tier: 'paid' }
  ];

  const handleVerifyPassword = async () => {
    if (!password.trim()) {
      toast.error('Please enter password');
      return;
    }

    // Simulate password verification
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      // In real app, this would verify against stored hash
      if (password === 'jarvis123') { // Simplified for demo
        setIsVerified(true);
        toast.success('Password verified!');
      } else {
        setIsVerified(false);
        toast.error('Incorrect password');
      }
    } catch (error) {
      toast.error('Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleModelChange = (modelId: string) => {
    setDefaultModel(modelId);
    const model = MODELS.find(m => m.id === modelId);
    setIsPaidModelWarning(model?.tier === 'paid');
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground/90">
          Settings
        </h2>
        <p className="text-sm text-muted-foreground">
          Configure your JARVIS experience
        </p>
      </div>

      {/* Password Verification */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-foreground/90">
          Security
        </h3>
        <div className="space-y-2">
          <Input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="glass-panel-hover"
          />
          
          <Button 
            onClick={handleVerifyPassword}
            disabled={isLoading}
            className="w-full ai-primary"
          >
            {isLoading ? (
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
          
          {isVerified && (
            <div className="text-xs text-green-600">
              ✓ Verified for this session
            </div>
          )}
          
          {!isVerified && !isLoading && (
            <p className="text-xs text-muted-foreground">
              Password required for: adding knowledge entries & using paid models
            </p>
          )}
        </div>
      </div>

      {/* Model Settings */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-foreground/90">
          AI Model Preferences
        </h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Default Model</span>
            <span className="text-xs text-muted-foreground">
              {defaultModel}
            </span>
          </div>
          <SelectTrigger className="w-full glass-panel-hover">
            <SelectValue placeholder="Select default model" />
          </SelectTrigger>
          <SelectContent className="w-full glass-panel">
            {MODELS.map((model) => (
              <SelectItem 
                key={model.id} 
                value={model.id}
              >
                <div className="flex items-center space-x-2">
                  <Bot className="h-4 w-4" 
                    style={{ opacity: model.tier === 'paid' ? 0.7 : 1 }} />
                  <span>{model.name}</span>
                  {model.tier === 'paid' && (
                    <span className="ml-auto text-xs bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded">
                      Paid
                    </span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </div>
        
        {isPaidModelWarning && (
          <div className="text-xs text-indigo-600 bg-indigo-50/50 p-2 rounded mt-2">
            ⚠️ Selected model is paid - password required for usage
          </div>
        )}
      </div>

      {/* Appearance Settings */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-foreground/90">
          Appearance
        </h3>
        <div className="space-y-2">
          <div className="flex items-center space-x-3">
            <Label className="text-sm font-medium">
              <Switch
                checked={theme === 'dark'}
                onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
              />
              Dark Mode
            </Label>
          </div>
        </div>
      </div>

      {/* Advanced Settings */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-foreground/90">
          Advanced Preferences
        </h3>
        <div className="space-y-2">
          <div className="space-y-3">
            <Label className="text-sm font-medium block mb-1">
              Auto-pick Threshold (%)
            </Label>
            <div className="flex items-center space-x-3">
              <Slider
                value={autoPickThreshold}
                onValueChange={(value) => setAutoPickThreshold(value)}
                min={70}
                max={95}
                step={5}
                className="w-32"
              />
              <span className="text-xs font-mono">{autoPickThreshold}%</span>
            </div>
            <p className="text-xs text-muted-foreground">
              When a preference reaches this percentage, auto-select without asking
            </p>
          </div>
          
          <div className="space-y-3">
            <Label className="text-sm font-medium block mb-1">
              Minimum Sample Size
            </Label>
            <div className="flex items-center space-x-3">
              <Slider
                value={minSampleSize}
                onValueChange={(value) => setMinSampleSize(value)}
                min={3}
                max={10}
                step={1}
                className="w-32"
              />
              <span className="text-xs font-mono">{minSampleSize}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Minimum number of choices needed before auto-pick activates
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="border-t pt-4">
        <div className="flex flex-col sm:flex-row sm:space-x-3">
          <Button 
            variant="outline"
            onClick={() => {
              toast.info('Export feature coming soon!');
            }}
            className="flex-1 glass-panel-hover"
          >
            <Settings className="h-4 w-4 mr-2" /> Export Knowledge
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => {
              toast.info('Import feature coming soon!');
            }}
            className="flex-1 glass-panel-hover"
          >
            <Upload className="h-4 w-4 mr-2" /> Import Knowledge
          </Button>
        </div>
        
        <div className="mt-4 text-center">
          <Button 
            variant="destructive"
            onClick={() => {
              // Reset settings
              setDefaultModel('gemini-flash');
              setTheme('system');
              setAutoPickThreshold(90);
              setMinSampleSize(5);
              toast.success('Settings reset to defaults');
            }}
            className="text-xs"
          >
            Reset to Defaults
          </Button>
        </div>
      </div>
    </div>
  );
}