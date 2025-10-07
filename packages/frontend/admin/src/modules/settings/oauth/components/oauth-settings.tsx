import { useMemo } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@affine/admin/components/ui/accordion';
import { Badge } from '@affine/admin/components/ui/badge';
import { Button } from '@affine/admin/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@affine/admin/components/ui/card';
import { Skeleton } from '@affine/admin/components/ui/skeleton';
import { AlertTriangle, Copy, Lock, Shield, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface OAuthSettingsProps {
  callbackUrls: Record<string, string>;
  loading: boolean;
  onRefresh: () => Promise<void>;
}

const CallbackSkeleton = () => (
  <div className="space-y-4">
    {[1, 2, 3].map(index => (
      <div key={index} className="rounded-xl border border-slate-200/70 bg-white/70 p-4">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="mt-3 h-3 w-full" />
      </div>
    ))}
  </div>
);

export function OAuthSettings({ callbackUrls, loading, onRefresh }: OAuthSettingsProps) {
  const callbackEntries = useMemo(() => Object.entries(callbackUrls ?? {}), [callbackUrls]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        toast.success('已复制到剪贴板');
      })
      .catch(() => {
        toast.error('复制失败，请手动复制');
      });
  };

  const hasCallbacks = callbackEntries.length > 0;

  return (
    <div className="space-y-6">
      <Card className="border border-slate-200/70 bg-white/90 backdrop-blur">
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-slate-900">回调地址总览</CardTitle>
            <p className="text-sm text-slate-500">在第三方平台配置重定向 URI 时，请使用以下地址。</p>
          </div>
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading} className="gap-2">
            {loading ? '刷新中...' : '刷新配置'}
          </Button>
        </CardHeader>
        <CardContent className="space-y-5">
          {loading && !hasCallbacks && <CallbackSkeleton />}

          {!loading && !hasCallbacks && (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-6 text-center text-sm text-slate-500">
              暂未获取到回调地址，请刷新或检查后端配置。
            </div>
          )}

          {hasCallbacks && (
            <div className="grid gap-4 md:grid-cols-2">
              {callbackEntries.map(([provider, url]) => (
                <div
                  key={provider}
                  className="group relative overflow-hidden rounded-2xl border border-slate-200/70 bg-gradient-to-br from-white via-white to-slate-50 p-4 shadow-sm"
                >
                  <div className="absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-hover:bg-blue-50/40" />
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="capitalize">
                        {provider}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1"
                      onClick={() => copyToClipboard(url)}
                    >
                      <Copy className="h-4 w-4" />
                      复制
                    </Button>
                  </div>
                  <div className="relative mt-3 rounded-lg bg-slate-900/80 p-3 font-mono text-xs text-white">
                    <div className="absolute inset-0 rounded-lg border border-white/20" />
                    <span className="relative block break-all">{url}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border border-slate-200/70 bg-white/90 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
            <Sparkles className="h-4 w-4 text-blue-500" /> 配置指南
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Accordion type="multiple" defaultValue={["google", "github"]}>
            <AccordionItem value="google">
              <AccordionTrigger className="text-sm font-semibold text-slate-700">
                Google OAuth
              </AccordionTrigger>
              <AccordionContent className="space-y-2 text-sm text-slate-600">
                <p>1. 访问 <a href="https://console.developers.google.com/" target="_blank" className="text-blue-500 hover:underline">Google Cloud Console</a>，创建或选择项目。</p>
                <p>2. 在「凭据」中创建 OAuth 客户端 ID，类型选择 Web 应用。</p>
                <p>3. 在授权重定向 URI 中填写上方对应的回调地址。</p>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="github">
              <AccordionTrigger className="text-sm font-semibold text-slate-700">
                GitHub OAuth
              </AccordionTrigger>
              <AccordionContent className="space-y-2 text-sm text-slate-600">
                <p>1. 前往 <a href="https://github.com/settings/developers" target="_blank" className="text-blue-500 hover:underline">GitHub Developer Settings</a>。</p>
                <p>2. 创建新的 OAuth App，Homepage URL 建议填写服务器地址。</p>
                <p>3. 在 Authorization Callback URL 中粘贴对应的回调地址。</p>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="microsoft">
              <AccordionTrigger className="text-sm font-semibold text-slate-700">
                Microsoft OAuth
              </AccordionTrigger>
              <AccordionContent className="space-y-2 text-sm text-slate-600">
                <p>1. 访问 <a href="https://portal.azure.com/" target="_blank" className="text-blue-500 hover:underline">Azure Portal</a> 注册应用。</p>
                <p>2. 在「身份验证」中添加 Web 平台，输入回调地址。</p>
                <p>3. 在 API 权限中至少勾选 User.Read。</p>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="apple">
              <AccordionTrigger className="text-sm font-semibold text-slate-700">
                Apple OAuth
              </AccordionTrigger>
              <AccordionContent className="space-y-2 text-sm text-slate-600">
                <p>1. 登录 <a href="https://developer.apple.com/" target="_blank" className="text-blue-500 hover:underline">Apple Developer</a> 创建 Service ID。</p>
                <p>2. 勾选 Sign in with Apple，并添加回调 URL。</p>
                <p>3. 生成私钥并妥善保存，后续用于 JWT 签名。</p>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="oidc">
              <AccordionTrigger className="text-sm font-semibold text-slate-700">
                自定义 OIDC
              </AccordionTrigger>
              <AccordionContent className="space-y-2 text-sm text-slate-600">
                <p>1. 确认提供商支持标准 OIDC 流程。</p>
                <p>2. 从 /.well-known/openid-configuration 获取可用端点。</p>
                <p>3. 注册客户端后配置 Client ID、Client Secret 及回调地址。</p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      <Card className="border border-slate-200/70 bg-white/90 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
            <Shield className="h-4 w-4 text-emerald-500" /> 安全建议
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-600">
          <div className="flex items-start gap-3 rounded-xl border border-amber-200/60 bg-amber-50/50 p-4">
            <AlertTriangle className="mt-1 h-4 w-4 text-amber-500" />
            <div>
              <span className="font-medium text-amber-700">妥善保管 Client Secret</span>
              <p className="mt-2 text-xs leading-5 text-amber-600">
                仅在后端安全地保存密钥，不要在前端或公开仓库中曝光。建议定期轮换密钥并记录更新时间。
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-xl border border-blue-200/60 bg-blue-50/60 p-4">
            <Lock className="mt-1 h-4 w-4 text-blue-500" />
            <div>
              <span className="font-medium text-blue-700">启用 HTTPS 与回调校验</span>
              <p className="mt-2 text-xs leading-5 text-blue-600">
                生产环境必须使用 HTTPS，同时在后端校验回调域名，防止被伪造的重定向地址利用。
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-xl border border-emerald-200/60 bg-emerald-50/60 p-4">
            <Sparkles className="mt-1 h-4 w-4 text-emerald-500" />
            <div>
              <span className="font-medium text-emerald-700">最小权限原则</span>
              <p className="mt-2 text-xs leading-5 text-emerald-600">
                仅申请业务所需的最小 Scope；上线后如需新增权限，请再次通知用户并更新隐私策略。
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
