import { useEffect, useState } from 'react';
import { Button } from '@yunke/admin/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@yunke/admin/components/ui/card';
import { Input } from '@yunke/admin/components/ui/input';
import { Label } from '@yunke/admin/components/ui/label';
import { Loader2, Save } from 'lucide-react';

interface IntegrationCardProps {
  title: string;
  description: string;
  placeholder?: string;
  value?: string;
  saving: boolean;
  onSave: (value: string) => Promise<void>;
}

export function IntegrationCard({ title, description, placeholder, value, saving, onSave }: IntegrationCardProps) {
  const [localValue, setLocalValue] = useState(value ?? '');
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setLocalValue(value ?? '');
    setDirty(false);
  }, [value]);

  const handleSave = async () => {
    await onSave(localValue);
    setDirty(false);
  };

  return (
    <Card className="border border-slate-200/70 bg-white/90 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-base text-slate-900">{title}</CardTitle>
        <CardDescription className="text-xs text-slate-500">{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <Label>{title} Key</Label>
          <Input
            type="password"
            placeholder={placeholder}
            value={localValue}
            onChange={event => {
              setLocalValue(event.target.value);
              setDirty(true);
            }}
          />
        </div>
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving || !dirty} className="flex items-center gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            保存
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
