import { Card, CardContent, CardHeader, CardTitle } from '@affine/admin/components/ui/card';
import { Button } from '@affine/admin/components/ui/button';
import { Progress } from '@affine/admin/components/ui/progress';
import type { OAuthStatistics, OAuthProvider } from '../types';

interface OAuthStatisticsProps {
  statistics: OAuthStatistics | null;
  providers: OAuthProvider[];
  loading: boolean;
  onRefresh: () => Promise<void>;
}

export function OAuthStatistics({ statistics, providers, loading, onRefresh }: OAuthStatisticsProps) {
  if (!statistics) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <div className="text-gray-500 mb-4">暂无统计数据</div>
          <Button variant="outline" onClick={onRefresh} disabled={loading}>
            {loading ? '加载中...' : '刷新'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const enabledRate = statistics.totalProviders > 0 
    ? (statistics.enabledProviders / statistics.totalProviders) * 100 
    : 0;
  
  const configuredRate = statistics.totalProviders > 0 
    ? (statistics.configuredProviders / statistics.totalProviders) * 100 
    : 0;

  return (
    <div className="space-y-6">
      {/* 概览统计 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              总提供商数
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalProviders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              已启用
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {statistics.enabledProviders}
            </div>
            <div className="text-xs text-gray-500">
              {enabledRate.toFixed(1)}% 启用率
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              已配置
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {statistics.configuredProviders}
            </div>
            <div className="text-xs text-gray-500">
              {configuredRate.toFixed(1)}% 配置率
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              OAuth用户数
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {statistics.totalOAuthUsers}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 配置完成度 */}
      <Card>
        <CardHeader>
          <CardTitle>配置完成度</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>启用率</span>
              <span>{enabledRate.toFixed(1)}%</span>
            </div>
            <Progress value={enabledRate} className="h-2" />
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>配置率</span>
              <span>{configuredRate.toFixed(1)}%</span>
            </div>
            <Progress value={configuredRate} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* 各提供商用户分布 */}
      {statistics.usersByProvider && Object.keys(statistics.usersByProvider).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>用户分布</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(statistics.usersByProvider)
                .sort(([, a], [, b]) => Number(b) - Number(a))
                .map(([provider, count]) => {
                  const percentage = statistics.totalOAuthUsers > 0 
                    ? (Number(count) / statistics.totalOAuthUsers) * 100 
                    : 0;
                  
                  return (
                    <div key={provider} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="capitalize">{provider}</span>
                        <span>{count} 用户 ({percentage.toFixed(1)}%)</span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 最近登录统计 */}
      {statistics.recentLogins && Object.keys(statistics.recentLogins).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>最近30天登录统计</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(statistics.recentLogins)
                .sort(([, a], [, b]) => Number(b) - Number(a))
                .map(([provider, count]) => (
                  <div key={provider} className="flex justify-between items-center">
                    <span className="capitalize">{provider}</span>
                    <span className="font-medium">{count} 次</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 最受欢迎的提供商 */}
      {statistics.mostPopularProvider && (
        <Card>
          <CardHeader>
            <CardTitle>最受欢迎的提供商</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-3xl mb-2">
                {statistics.mostPopularProvider === 'google' && '🔍'}
                {statistics.mostPopularProvider === 'github' && '🐱'}
                {statistics.mostPopularProvider === 'microsoft' && '🪟'}
                {statistics.mostPopularProvider === 'apple' && '🍎'}
                {statistics.mostPopularProvider === 'oidc' && '🔐'}
              </div>
              <div className="text-lg font-semibold capitalize">
                {statistics.mostPopularProvider}
              </div>
              <div className="text-sm text-gray-500">
                {statistics.usersByProvider?.[statistics.mostPopularProvider]} 用户选择
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 更新时间 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              最后更新: {new Date(statistics.lastUpdated).toLocaleString('zh-CN')}
            </div>
            <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
              {loading ? '刷新中...' : '刷新统计'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}