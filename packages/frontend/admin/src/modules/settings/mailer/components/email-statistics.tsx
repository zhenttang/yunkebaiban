import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@affine/admin/components/ui/card';
import { Button } from '@affine/admin/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@affine/admin/components/ui/select';
import { Badge } from '@affine/admin/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@affine/admin/components/ui/tabs';
import { DatePickerWithRange } from '@affine/admin/components/ui/date-range-picker';
import { 
  Loader2, 
  Mail, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  RefreshCw,
  Download,
  BarChart3,
  PieChart,
  Clock,
  Users
} from 'lucide-react';
import { toast } from 'sonner';

import { useMailerConfig } from '../hooks/use-mailer-config';
import { useEmailTemplates } from '../hooks/use-email-templates';
import type { EmailStatisticsDto, EmailLogDto, TemplateUsageDto } from '../types';

// 模拟的统计数据接口（实际应该来自后端）
interface StatisticsData {
  overview: {
    totalSent: number;
    successRate: number;
    failureRate: number;
    totalTemplates: number;
    todaySent: number;
    weekSent: number;
    monthSent: number;
  };
  trend: Array<{
    date: string;
    sent: number;
    success: number;
    failed: number;
  }>;
  templates: TemplateUsageDto[];
  recentLogs: EmailLogDto[];
}

export function EmailStatistics() {
  const { config } = useMailerConfig();
  const { templates } = useEmailTemplates();
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState<StatisticsData | null>(null);
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30天前
    to: new Date()
  });
  const [selectedTemplate, setSelectedTemplate] = useState<string>('all');

  // 获取统计数据
  const fetchStatistics = async () => {
    setLoading(true);
    try {
      // 模拟API调用 - 实际应该调用后端API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 模拟数据
      const mockData: StatisticsData = {
        overview: {
          totalSent: 15420,
          successRate: 96.8,
          failureRate: 3.2,
          totalTemplates: templates.length,
          todaySent: 245,
          weekSent: 1680,
          monthSent: 7240
        },
        trend: generateTrendData(),
        templates: generateTemplateUsage(),
        recentLogs: generateRecentLogs()
      };
      
      setStatistics(mockData);
    } catch (err) {
      console.error('Failed to fetch statistics:', err);
      toast.error('获取统计数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 生成趋势数据
  const generateTrendData = () => {
    const data = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const sent = Math.floor(Math.random() * 300) + 50;
      const success = Math.floor(sent * (0.95 + Math.random() * 0.05));
      const failed = sent - success;
      
      data.push({
        date: date.toISOString().split('T')[0],
        sent,
        success,
        failed
      });
    }
    return data;
  };

  // 生成模板使用统计
  const generateTemplateUsage = (): TemplateUsageDto[] => {
    return templates.map(template => ({
      templateId: template.id,
      templateName: template.name,
      templateType: template.type,
      usageCount: Math.floor(Math.random() * 1000) + 10,
      successCount: Math.floor(Math.random() * 950) + 10,
      failureCount: Math.floor(Math.random() * 50),
      lastUsed: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
    }));
  };

  // 生成最近日志
  const generateRecentLogs = (): EmailLogDto[] => {
    const logs = [];
    for (let i = 0; i < 20; i++) {
      logs.push({
        id: `log-${i}`,
        toEmail: `user${i}@example.com`,
        subject: `测试邮件 ${i + 1}`,
        templateId: templates[Math.floor(Math.random() * templates.length)]?.id || '',
        status: Math.random() > 0.1 ? 'success' : 'failed',
        sentAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
        errorMessage: Math.random() > 0.9 ? '网络连接超时' : undefined
      });
    }
    return logs;
  };

  // 导出数据
  const handleExportData = () => {
    if (!statistics) return;
    
    const data = {
      exportTime: new Date().toISOString(),
      dateRange,
      overview: statistics.overview,
      trend: statistics.trend,
      templates: statistics.templates
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `email-statistics-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('数据导出成功');
  };

  // 格式化数字
  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  // 格式化百分比
  const formatPercentage = (num: number) => {
    return `${num.toFixed(1)}%`;
  };

  useEffect(() => {
    fetchStatistics();
  }, [dateRange, selectedTemplate]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-40">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>加载统计数据中...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!statistics) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-40">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <div className="text-red-600">统计数据加载失败</div>
            <Button variant="outline" onClick={fetchStatistics} className="mt-2">
              重试
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">邮件统计</h2>
          <p className="text-muted-foreground">
            查看邮件发送统计、成功率分析和历史数据
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchStatistics}>
            <RefreshCw className="h-4 w-4 mr-2" />
            刷新
          </Button>
          <Button variant="outline" onClick={handleExportData}>
            <Download className="h-4 w-4 mr-2" />
            导出数据
          </Button>
        </div>
      </div>

      {/* 筛选条件 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">时间范围:</label>
              <DatePickerWithRange
                value={dateRange}
                onChange={setDateRange}
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">模板:</label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有模板</SelectItem>
                  {templates.map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 概览统计 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总发送量</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(statistics.overview.totalSent)}</div>
            <p className="text-xs text-muted-foreground">
              今日: {formatNumber(statistics.overview.todaySent)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">成功率</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatPercentage(statistics.overview.successRate)}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              本周: {formatNumber(statistics.overview.weekSent)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">失败率</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatPercentage(statistics.overview.failureRate)}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
              本月: {formatNumber(statistics.overview.monthSent)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">活跃模板</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.overview.totalTemplates}</div>
            <p className="text-xs text-muted-foreground">
              已启用模板数量
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 详细统计 */}
      <Tabs defaultValue="trend" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trend">发送趋势</TabsTrigger>
          <TabsTrigger value="templates">模板使用</TabsTrigger>
          <TabsTrigger value="logs">发送日志</TabsTrigger>
        </TabsList>

        {/* 发送趋势 */}
        <TabsContent value="trend">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                发送趋势分析
              </CardTitle>
              <CardDescription>
                过去30天的邮件发送量和成功率趋势
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* 趋势图表占位符 */}
                <div className="h-80 bg-gray-50 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">趋势图表</p>
                    <p className="text-sm text-gray-400">
                      显示{statistics.trend.length}天的发送数据
                    </p>
                  </div>
                </div>

                {/* 趋势数据表格 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {formatNumber(statistics.trend.reduce((sum, day) => sum + day.sent, 0))}
                    </div>
                    <div className="text-sm text-blue-600">总发送量</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {formatNumber(statistics.trend.reduce((sum, day) => sum + day.success, 0))}
                    </div>
                    <div className="text-sm text-green-600">成功发送</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {formatNumber(statistics.trend.reduce((sum, day) => sum + day.failed, 0))}
                    </div>
                    <div className="text-sm text-red-600">发送失败</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 模板使用统计 */}
        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                模板使用统计
              </CardTitle>
              <CardDescription>
                各个邮件模板的使用频率和成功率
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {statistics.templates.map((template) => {
                  const successRate = template.usageCount > 0 
                    ? (template.successCount / template.usageCount) * 100 
                    : 0;
                  
                  return (
                    <div key={template.templateId} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{template.templateName}</h3>
                          <Badge variant="outline">{template.templateType}</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          上次使用: {new Date(template.lastUsed).toLocaleString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-6 text-sm">
                        <div className="text-center">
                          <div className="font-medium">{formatNumber(template.usageCount)}</div>
                          <div className="text-muted-foreground">使用次数</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-green-600">{formatNumber(template.successCount)}</div>
                          <div className="text-muted-foreground">成功</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-red-600">{formatNumber(template.failureCount)}</div>
                          <div className="text-muted-foreground">失败</div>
                        </div>
                        <div className="text-center">
                          <div className={`font-medium ${successRate >= 95 ? 'text-green-600' : successRate >= 90 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {formatPercentage(successRate)}
                          </div>
                          <div className="text-muted-foreground">成功率</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 发送日志 */}
        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                最近发送日志
              </CardTitle>
              <CardDescription>
                最近的邮件发送记录和状态
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {statistics.recentLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {log.status === 'success' ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                      <div>
                        <div className="font-medium">{log.subject}</div>
                        <div className="text-sm text-muted-foreground">
                          发送至: {log.toEmail}
                        </div>
                        {log.errorMessage && (
                          <div className="text-sm text-red-600">
                            错误: {log.errorMessage}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={log.status === 'success' ? 'default' : 'destructive'}>
                        {log.status === 'success' ? '成功' : '失败'}
                      </Badge>
                      <div className="text-sm text-muted-foreground mt-1">
                        {new Date(log.sentAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}