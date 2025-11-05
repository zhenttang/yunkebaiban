import { Badge } from '@yunke/admin/components/ui/badge';
import { Button } from '@yunke/admin/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@yunke/admin/components/ui/card';
import { Skeleton } from '@yunke/admin/components/ui/skeleton';
import { Ban, Clock, Loader2, RefreshCw, Shield, Unlock } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import type { BlockedIp } from '../types';
import { useUnblockIp } from '../hooks/use-security-monitor';

interface BlockedIpsTableProps {
  blockedIps: BlockedIp[] | undefined;
  loading: boolean;
  onRefresh: () => void;
}

export function BlockedIpsTable({
  blockedIps,
  loading,
  onRefresh,
}: BlockedIpsTableProps) {
  const unblockMutation = useUnblockIp();
  const [unblockingIp, setUnblockingIp] = useState<string | null>(null);

  const handleUnblock = async (ip: string) => {
    try {
      setUnblockingIp(ip);
      await unblockMutation.trigger(ip);
      toast.success(`IP ${ip} 已被解封`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '解封失败');
    } finally {
      setUnblockingIp(null);
    }
  };

  const formatRemainingTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}分钟`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}小时${mins}分钟`;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Ban className="h-5 w-5 text-rose-500" />
          <CardTitle>IP封禁列表</CardTitle>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          刷新
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="mt-2 h-3 w-48" />
                </div>
                <Skeleton className="h-9 w-20" />
              </div>
            ))}
          </div>
        ) : !blockedIps || blockedIps.length === 0 ? (
          <div className="rounded-lg border border-dashed p-12 text-center">
            <Shield className="mx-auto h-12 w-12 text-emerald-500" />
            <p className="mt-4 text-sm text-muted-foreground">
              当前没有被封禁的IP，系统安全状态良好
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {blockedIps.map((item) => (
              <div
                key={item.ip}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-medium">{item.ip}</span>
                    <Badge variant="destructive" className="gap-1">
                      <Clock className="h-3 w-3" />
                      剩余 {formatRemainingTime(item.remainingMinutes)}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {item.reason}
                  </p>
                  {item.blockedAt && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      封禁时间: {item.blockedAt}
                    </p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUnblock(item.ip)}
                  disabled={unblockingIp === item.ip}
                >
                  {unblockingIp === item.ip ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Unlock className="mr-2 h-4 w-4" />
                  )}
                  解封
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

