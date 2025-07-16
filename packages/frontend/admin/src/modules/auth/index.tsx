import { Button } from '@affine/admin/components/ui/button';
import { Input } from '@affine/admin/components/ui/input';
import { Label } from '@affine/admin/components/ui/label';

import type { FormEvent } from 'react';
import { useCallback, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { toast } from 'sonner';

import { httpClient } from '../../../../../common/request/src';
import { isAdmin, useCurrentUser, useRevalidateCurrentUser } from '../common';
import logo from './logo.svg';

export function Auth() {
  const currentUser = useCurrentUser();
  const revalidate = useRevalidateCurrentUser();
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  
  console.log('Auth组件:', currentUser === undefined ? '加载中' : currentUser === null ? '未登录' : `已登录: ${currentUser.email}, isAdmin: ${isAdmin(currentUser)}`);
  
  const login = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!emailRef.current || !passwordRef.current) return;
      
      console.log('=== 开始登录流程 ===');
      console.log('登录前 currentUser:', currentUser);
      console.log('登录前 isAdmin(currentUser):', currentUser ? isAdmin(currentUser) : 'currentUser is null/undefined');
      
      try {
        const result = await httpClient.post('/api/auth/sign-in', {
          email: emailRef.current?.value,
          password: passwordRef.current?.value,
        });
        
        console.log('登录API响应:', result);
        if (result.success) {
          // 保存令牌到localStorage
          if (result.token) {
            localStorage.setItem('affine-admin-token', result.token);
            console.log('令牌已保存到localStorage');
            
            if (result.refreshToken) {
              localStorage.setItem('affine-admin-refresh-token', result.refreshToken);
              console.log('刷新令牌已保存到localStorage');
            }
          }
          
          toast.success('登录成功');
          console.log('=== 开始revalidate用户信息 ===');
          
          // 立即触发用户信息刷新，然后等待状态更新
          await revalidate();
          console.log('=== revalidate完成 ===');
          
          // 短暂延迟确保状态已更新
          setTimeout(() => {
            console.log('登录后状态检查，准备跳转');
          }, 200);
        } else {
          toast.error(result.message || '登录失败');
        }
      } catch (err: any) {
        console.error('登录API错误:', err);
        toast.error(`登录失败: ${err.message || '未知错误'}`);
      }
    },
    [revalidate, currentUser]
  );

  if (currentUser && isAdmin(currentUser)) {
    console.log('已登录管理员，重定向到账户页面');
    return <Navigate to="/admin/accounts" replace />;
  }

  return (
    <div className="w-full lg:grid lg:min-h-[600px] lg:grid-cols-2 xl:min-h-[800px] h-screen">
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[350px] gap-6">
          <div className="grid gap-2 text-center">
            <h1 className="text-3xl font-bold">登录</h1>
            <p className="text-balance text-muted-foreground">
              请在下方输入邮箱以登录您的账户
            </p>
          </div>
          <form onSubmit={login} action="#">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">邮箱</Label>
                <Input
                  id="email"
                  type="email"
                  ref={emailRef}
                  placeholder="邮箱@示例.com"
                  autoComplete="email"
                  required
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">密码</Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  ref={passwordRef}
                  autoComplete="current-password"
                  required
                />
              </div>
              <Button onClick={login} type="submit" className="w-full">
                登录
              </Button>
            </div>
          </form>
        </div>
      </div>
      <div className="hidden bg-muted lg:flex lg:justify-center">
        <img
          src={logo}
          alt="Image"
          className="h-1/2 object-cover dark:brightness-[0.2] dark:grayscale relative top-1/4 "
        />
      </div>
    </div>
  );
}

export { Auth as Component };
