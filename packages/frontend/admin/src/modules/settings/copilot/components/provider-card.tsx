import { useEffect, useState } from 'react';
import { Badge } from '@yunke/admin/components/ui/badge';
import { Button } from '@yunke/admin/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@yunke/admin/components/ui/card';
import { Input } from '@yunke/admin/components/ui/input';
import { Label } from '@yunke/admin/components/ui/label';
import { Switch } from '@yunke/admin/components/ui/switch';
import { ExternalLink, Loader2, Save } from 'lucide-react';

import type { CopilotProviderConfig } from '../hooks/use-copilot-config';

interface ProviderCardProps {
  id: string;
  name: string;
  docs?: string;
  config: CopilotProviderConfig;
  saving: boolean;
  onSave: (payload: CopilotProviderConfig) => Promise<void>;
}

export function ProviderCard({ id, name, docs, config, saving, onSave }: ProviderCardProps) {
  const [apiKey, setApiKey] = useState(config.apiKey ?? '');
  const [baseUrl, setBaseUrl] = useState(config.baseUrl ?? '');
  const [model, setModel] = useState(config.model ?? '');
  const [enabled, setEnabled] = useState(config.enabled ?? false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setApiKey(config.apiKey ?? '');
    setBaseUrl(config.baseUrl ?? '');
    setModel(config.model ?? '');
    setEnabled(config.enabled ?? false);
    setDirty(false);
  }, [config.apiKey, config.baseUrl, config.model, config.enabled]);

  const markDirty = () => setDirty(true);

  const handleSave = async () => {
    await onSave({
      apiKey: apiKey || undefined,
      baseUrl: baseUrl || undefined,
      model: model || undefined,
      enabled,
    });
    setDirty(false);
  };

  return (
    <Card className="border border-slate-200/70 bg-white/90 backdrop-blur">
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <CardTitle className="text-lg text-slate-900">{name}</CardTitle>
          <CardDescription>
            为 {name} 配置访问密钥与模型。
            {docs && (
              <a
                href={docs}
                target="_blank"
                rel="noreferrer"
                className="ml-1 inline-flex items-center gap-1 text-xs text-blue-500 hover:underline"
              >
                文档 <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </CardDescription>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>启用</span>
          <Switch
            checked={enabled}
            onCheckedChange={checked => {
              setEnabled(checked);
              markDirty();
            }}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor={`${id}-api-key`}>API Key</Label>
          <Input
            id={`${id}-api-key`}
            type="password"
            placeholder="sk-xxxxxxxx"
            value={apiKey}
            onChange={event => {
              setApiKey(event.target.value);
              markDirty();
            }}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`${id}-base-url`}>Base URL (可选)</Label>
            <Input
              id={`${id}-base-url`}
              placeholder="https://api.example.com"
              value={baseUrl}
              onChange={event => {
                setBaseUrl(event.target.value);
                markDirty();
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${id}-model`}>默认模型 (可选)</Label>
            <Input
              id={`${id}-model`}
              placeholder="gpt-4o-mini"
              value={model}
              onChange={event => {
                setModel(event.target.value);
                markDirty();
              }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 pt-4 text-xs text-slate-500">
          <Badge variant={enabled ? 'default' : 'secondary'} className="rounded-full px-2 py-0.5">
            {enabled ? '已启用' : '未启用'}
          </Badge>
          <Button
            onClick={handleSave}
            disabled={saving || !dirty}
            className="flex items-center gap-2"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            保存配置
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
