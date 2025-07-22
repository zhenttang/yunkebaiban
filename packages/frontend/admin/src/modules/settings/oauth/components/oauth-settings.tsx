import { Card, CardContent, CardHeader, CardTitle } from '@affine/admin/components/ui/card';
import { Button } from '@affine/admin/components/ui/button';
import { Badge } from '@affine/admin/components/ui/badge';

interface OAuthSettingsProps {
  callbackUrls: Record<string, string>;
  loading: boolean;
  onRefresh: () => Promise<void>;
}

export function OAuthSettings({ callbackUrls, loading, onRefresh }: OAuthSettingsProps) {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // 可以添加一个toast通知
    });
  };

  return (
    <div className="space-y-6">
      {/* 回调URL配置 */}
      <Card>
        <CardHeader>
          <CardTitle>OAuth回调URL配置</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-sm text-gray-600 mb-4">
              请在各OAuth提供商的应用配置中设置以下回调URL：
            </div>
            
            {Object.entries(callbackUrls).map(([provider, url]) => (
              <div key={provider} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize">
                      {provider}
                    </Badge>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(url)}
                  >
                    复制
                  </Button>
                </div>
                <div className="font-mono text-sm bg-gray-50 p-2 rounded break-all">
                  {url}
                </div>
              </div>
            ))}
            
            {Object.keys(callbackUrls).length === 0 && (
              <div className="text-center text-gray-500 py-4">
                暂无回调URL配置
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* OAuth配置指南 */}
      <Card>
        <CardHeader>
          <CardTitle>配置指南</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">Google OAuth 配置</h4>
              <ol className="list-decimal list-inside space-y-1 text-gray-600">
                <li>访问 <a href="https://console.developers.google.com/" target="_blank" className="text-blue-500 hover:underline">Google Cloud Console</a></li>
                <li>创建或选择项目</li>
                <li>启用 Google+ API 或 People API</li>
                <li>创建OAuth 2.0客户端ID</li>
                <li>在授权重定向URI中添加上述回调URL</li>
              </ol>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">GitHub OAuth 配置</h4>
              <ol className="list-decimal list-inside space-y-1 text-gray-600">
                <li>访问 <a href="https://github.com/settings/developers" target="_blank" className="text-blue-500 hover:underline">GitHub Developer Settings</a></li>
                <li>点击 "New OAuth App"</li>
                <li>填写应用信息</li>
                <li>在Authorization callback URL中设置回调URL</li>
                <li>获取Client ID和Client Secret</li>
              </ol>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Microsoft OAuth 配置</h4>
              <ol className="list-decimal list-inside space-y-1 text-gray-600">
                <li>访问 <a href="https://portal.azure.com/" target="_blank" className="text-blue-500 hover:underline">Azure Portal</a></li>
                <li>注册新的应用程序</li>
                <li>在认证部分添加重定向URI</li>
                <li>配置API权限（User.Read等）</li>
                <li>获取应用程序ID和密钥</li>
              </ol>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Apple OAuth 配置</h4>
              <ol className="list-decimal list-inside space-y-1 text-gray-600">
                <li>访问 <a href="https://developer.apple.com/" target="_blank" className="text-blue-500 hover:underline">Apple Developer</a></li>
                <li>创建Service ID</li>
                <li>配置Sign in with Apple</li>
                <li>添加回调域名和URL</li>
                <li>生成私钥并配置JWT</li>
              </ol>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">自定义OIDC配置</h4>
              <ol className="list-decimal list-inside space-y-1 text-gray-600">
                <li>确保你的OIDC提供商支持标准流程</li>
                <li>获取Discovery文档URL（通常是 /.well-known/openid_configuration）</li>
                <li>注册应用并获取Client ID和Secret</li>
                <li>配置回调URL</li>
                <li>确认支持的scopes和claims</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 安全建议 */}
      <Card>
        <CardHeader>
          <CardTitle>安全建议</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <span className="text-orange-500">⚠️</span>
              <div>
                <strong>Client Secret保护：</strong>
                确保Client Secret仅在服务器端使用，不要暴露在前端代码中。
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <span className="text-blue-500">🔒</span>
              <div>
                <strong>HTTPS要求：</strong>
                OAuth回调URL必须使用HTTPS协议（开发环境除外）。
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <span className="text-green-500">✅</span>
              <div>
                <strong>Scope最小化：</strong>
                只请求应用必需的最小权限范围。
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <span className="text-purple-500">🔄</span>
              <div>
                <strong>定期轮换：</strong>
                定期更新Client Secret和密钥。
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 刷新按钮 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center">
            <Button variant="outline" onClick={onRefresh} disabled={loading}>
              {loading ? '刷新中...' : '刷新配置'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}