import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@yunke/admin/components/ui/avatar';
import { Button } from '@yunke/admin/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@yunke/admin/components/ui/dropdown-menu';
import { MoreVerticalIcon } from '@blocksuite/icons/rc';
import { cssVarV2 } from '@toeverything/theme/v2';
import { CircleUser } from 'lucide-react';
import { useCallback } from 'react';
import { toast } from 'sonner';

import { yunkeFetch } from '../../fetch-utils';
import { useCurrentUser, useRevalidateCurrentUser } from '../common';
import { tokenManager } from '../../../../../common/request/src/interceptors';
import http from '../../../../../common/request/src';

interface UserDropdownProps {
  isCollapsed: boolean;
}

const UserInfo = ({
  name,
  email,
  avatarUrl,
}: {
  email: string;
  avatarUrl: string | null;
  name?: string;
}) => {
  return (
    <>
      <Avatar className="w-8 h-8">
        <AvatarImage src={avatarUrl ?? undefined} />
        <AvatarFallback>
          <CircleUser size={32} />
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col font-medium gap-1">
        {name ?? email.split('@')[0]}
        <span
          className="w-fit rounded px-2 py-0.5 text-xs h-5 border text-center inline-flex items-center font-normal"
          style={{
            borderRadius: '4px',
            backgroundColor: cssVarV2('chip/label/blue'),
            borderColor: cssVarV2('layer/insideBorder/border'),
          }}
        >
          Admin
        </span>
      </div>
    </>
  );
};

export function UserDropdown({ isCollapsed }: UserDropdownProps) {
  const currentUser = useCurrentUser();
  const relative = useRevalidateCurrentUser();

  const handleLogout = useCallback(async () => {
    try {
      // 1) 立即清除本地令牌，避免拦截器用 refreshToken 自动续期导致“又登录回来”
      tokenManager.remove();
      localStorage.removeItem('yunke-admin-refresh-token');

      // 2) 取消挂起请求，避免并发请求带旧 token
      http.cancelAll('logout');

      // 3) 通知服务器注销（可选，若服务端用cookie会清cookie）
      try {
        await yunkeFetch('/api/auth/sign-out', { method: 'POST' });
      } catch (_) {
        // 忽略服务器登出错误，以本地清理为准
      }

      // 4) 触发用户信息重新获取，更新为未登录态
      await relative();

      toast.success('已退出登录');

      // 5) 强制跳到登录页，打断可能的页面重试
      window.location.replace('/admin/auth');
    } catch (err: any) {
      toast.error(`退出失败: ${err?.message || '未知错误'}`);
    }
  }, [relative]);

  if (isCollapsed) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="w-10 h-10" size="icon">
            <Avatar className="w-5 h-5">
              <AvatarImage src={currentUser?.avatarUrl ?? undefined} />
              <AvatarFallback>
                <CircleUser size={24} />
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="right">
          <DropdownMenuLabel className="flex items-center gap-2">
            {currentUser ? (
              <UserInfo
                email={currentUser.email}
                name={currentUser.name}
                avatarUrl={currentUser.avatarUrl}
              />
            ) : null}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={handleLogout}>登出</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div
      className={`flex flex-none items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-1 py-3 flex-nowrap`}
    >
      <div className="flex items-center gap-2 font-medium text-ellipsis break-words overflow-hidden">
        <Avatar className="w-5 h-5">
          <AvatarImage src={currentUser?.avatarUrl ?? undefined} />
          <AvatarFallback>
            <CircleUser size={24} />
          </AvatarFallback>
        </Avatar>
        {currentUser?.name ? (
          <span
            className="text-sm text-nowrap text-ellipsis break-words overflow-hidden"
            title={currentUser?.name}
          >
            {currentUser?.name}
          </span>
        ) : (
          // Fallback to email prefix if name is not available
          <span className="text-sm" title={currentUser?.email.split('@')[0]}>
            {currentUser?.email.split('@')[0]}
          </span>
        )}
        <span
          className="ml-2 rounded px-2 py-0.5 text-xs h-5 border text-center inline-flex items-center font-normal"
          style={{
            borderRadius: '4px',
            backgroundColor: cssVarV2('chip/label/blue'),
            borderColor: cssVarV2('layer/insideBorder/border'),
          }}
        >
          Admin
        </span>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="ml-2 p-1 h-6">
            <MoreVerticalIcon fontSize={20} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="right">
          <DropdownMenuLabel className="flex items-center gap-2">
            {currentUser ? (
              <UserInfo
                email={currentUser.email}
                name={currentUser.name}
                avatarUrl={currentUser.avatarUrl}
              />
            ) : null}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={handleLogout}>登出</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
