import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Separator } from '../../components/ui/separator';
import { useToast } from '../../components/ui/use-toast';
import { useEffect, useState } from 'react';

interface SaveKeyParams {
  provider: string;
  apiKey: string;
}

export function Keys() {
  const [openAIKey, setOpenAIKey] = useState('');
  const [deepSeekKey, setDeepSeekKey] = useState('');
  const [falAIKey, setFalAIKey] = useState('');
  const [unsplashKey, setUnsplashKey] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // 获取当前配置
  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/admin/config');
      const data = await response.json();
      
      if (data.copilot) {
        if (data.copilot.providers?.openai?.apiKey) {
          setOpenAIKey(data.copilot.providers.openai.apiKey);
        }
        if (data.copilot.providers?.deepseek?.apiKey) {
          setDeepSeekKey(data.copilot.providers.deepseek.apiKey);
        }
        if (data.copilot.providers?.fal?.apiKey) {
          setFalAIKey(data.copilot.providers.fal.apiKey);
        }
        if (data.copilot.unsplash?.key) {
          setUnsplashKey(data.copilot.unsplash.key);
        }
      }
    } catch (error) {
      console.error('获取配置失败:', error);
    }
  };

  const saveKey = async ({ provider, apiKey }: SaveKeyParams) => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          module: 'copilot',
          key: provider,
          value: { apiKey },
        }),
      });

      if (response.ok) {
        toast({
          title: '成功',
          description: `${provider.split('.').pop()} API 密钥保存成功`,
        });
      } else {
        const error = await response.text();
        throw new Error(error);
      }
    } catch (error) {
      toast({
        title: '错误',
        description: `保存 ${provider.split('.').pop()} API 密钥失败：${error}`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full gap-3 py-5 px-6 w-full">
      <div className="flex items-center">
        <span className="text-xl font-semibold">密钥</span>
      </div>
      <div className="flex-grow overflow-y-auto space-y-[10px]">
        <div className="flex flex-col rounded-md border py-4 gap-4">
          <div className="px-5 space-y-3">
            <Label className="text-sm font-medium">OpenAI 密钥</Label>
            <div className="flex items-center gap-2">
              <Input
                type="text"
                className="py-2 px-3 text-base font-normal placeholder:opacity-50"
                value={openAIKey}
                placeholder="sk-xxxxxxxxxxxxx-xxxxxxxxxxxxxx"
                onChange={e => setOpenAIKey(e.target.value)}
              />
              <Button 
                disabled={loading} 
                onClick={() => saveKey({ provider: 'providers.openai', apiKey: openAIKey })}
              >
                保存
              </Button>
            </div>
          </div>
          <Separator />
          <div className="px-5 space-y-3">
            <Label className="text-sm font-medium">DeepSeek 密钥</Label>
            <div className="flex items-center gap-2">
              <Input
                type="text"
                className="py-2 px-3 text-base font-normal placeholder:opacity-50"
                value={deepSeekKey}
                placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                onChange={e => setDeepSeekKey(e.target.value)}
              />
              <Button 
                disabled={loading}
                onClick={() => saveKey({ provider: 'providers.deepseek', apiKey: deepSeekKey })}
              >
                保存
              </Button>
            </div>
          </div>
          <Separator />
          <div className="px-5 space-y-3">
            <Label className="text-sm font-medium">Fal.AI 密钥</Label>
            <div className="flex items-center gap-2">
              <Input
                type="email"
                className="py-2 px-3 ext-base font-normal placeholder:opacity-50"
                value={falAIKey}
                placeholder="00000000-0000-0000-00000000:xxxxxxxxxxxxxxxxx"
                onChange={e => setFalAIKey(e.target.value)}
              />
              <Button 
                disabled={loading}
                onClick={() => saveKey({ provider: 'providers.fal', apiKey: falAIKey })}
              >
                保存
              </Button>
            </div>
          </div>
          <Separator />
          <div className="px-5 space-y-3">
            <Label className="text-sm font-medium">Unsplash 密钥</Label>
            <div className="flex items-center gap-2">
              <Input
                type="password"
                className="py-2 px-3 ext-base font-normal placeholder:opacity-50"
                value={unsplashKey}
                placeholder="00000000-0000-0000-00000000:xxxxxxxxxxxxxxxxx"
                onChange={e => setUnsplashKey(e.target.value)}
              />
              <Button 
                disabled={loading}
                onClick={() => saveKey({ provider: 'unsplash', apiKey: unsplashKey })}
              >
                保存
              </Button>
            </div>
          </div>
          <Separator />
          <div className="px-5 space-y-3 text-sm font-normal text-gray-500">
            自定义 API 密钥可能无法按预期工作。YUNKE 不保证
            使用自定义 API 密钥时的结果。
          </div>
        </div>
      </div>
    </div>
  );
}
