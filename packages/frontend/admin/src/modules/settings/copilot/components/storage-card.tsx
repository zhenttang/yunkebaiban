import { useEffect, useState } from 'react';
import { Button } from '@affine/admin/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@affine/admin/components/ui/card';
import { Input } from '@affine/admin/components/ui/input';
import { Label } from '@affine/admin/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@affine/admin/components/ui/select';
import { Textarea } from '@affine/admin/components/ui/textarea';
import { Loader2, Save } from 'lucide-react';

import type { CopilotConfig } from '../hooks/use-copilot-config';

const STORAGE_PROVIDERS = [
  { value: 'fs', label: '本地文件系统 (fs)' },
  { value: 'aws-s3', label: 'AWS S3' },
  { value: 'cloudflare-r2', label: 'Cloudflare R2' },
  { value: 'tencent-cos', label: '腾讯 COS' },
];

interface StorageCardProps {
  storage: CopilotConfig['storage'];
  saving: boolean;
  onSave: (storage: CopilotConfig['storage']) => Promise<void>;
}

export function StorageCard({ storage, saving, onSave }: StorageCardProps) {
  const [provider, setProvider] = useState(storage.provider);
  const [bucket, setBucket] = useState(storage.bucket);
  const [config, setConfig] = useState(JSON.stringify(storage.config ?? {}, null, 2));
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setProvider(storage.provider);
    setBucket(storage.bucket);
    setConfig(JSON.stringify(storage.config ?? {}, null, 2));
    setError(null);
    setDirty(false);
  }, [storage.provider, storage.bucket, storage.config]);

  const handleSave = async () => {
    try {
      const parsed = config.trim() ? JSON.parse(config) : {};
      await onSave({ provider, bucket, config: parsed });
      setDirty(false);
      setError(null);
    } catch (err: any) {
      setError('配置必须是有效的 JSON 格式');
    }
  };

  return (
    <Card className="border border-slate-200/70 bg-white/90 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-base text-slate-900">模型文件存储</CardTitle>
        <CardDescription className="text-xs text-slate-500">
          配置 Copilot 在生成或缓存内容时使用的对象存储。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>存储提供商</Label>
            <Select
              value={provider}
              onValueChange={value => {
                setProvider(value);
                setDirty(true);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择存储类型" />
              </SelectTrigger>
              <SelectContent>
                {STORAGE_PROVIDERS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Bucket</Label>
            <Input
              placeholder="输入存储桶名称"
              value={bucket}
              onChange={event => {
                setBucket(event.target.value);
                setDirty(true);
              }}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>额外配置 (JSON)</Label>
          <Textarea
            rows={6}
            className="font-mono text-sm"
            value={config}
            onChange={event => {
              setConfig(event.target.value);
              setDirty(true);
            }}
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <p className="text-xs text-slate-400">如需配置访问密钥、区域信息等，可在此写入原始 JSON。</p>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving || !dirty} className="flex items-center gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            保存存储配置
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
