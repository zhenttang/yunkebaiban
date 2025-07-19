import { Button } from '@affine/admin/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@affine/admin/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@affine/admin/components/ui/form';
import { Input } from '@affine/admin/components/ui/input';
import { Switch } from '@affine/admin/components/ui/switch';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

import { createUser, updateUser } from '../user-actions';
import type { UserType } from '../schema';
import { useState } from 'react';

const userFormSchema = z.object({
  name: z.string().min(1, '姓名不能为空').max(50, '姓名不能超过50字符'),
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().optional(),
  enabled: z.boolean().default(true),
  avatarUrl: z.string().optional(),
});

type UserFormData = z.infer<typeof userFormSchema>;

interface UserEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: UserType | null; // null表示创建新用户
  onSuccess?: () => void;
}

export function UserEditDialog({ 
  open, 
  onOpenChange, 
  user, 
  onSuccess 
}: UserEditDialogProps) {
  const [loading, setLoading] = useState(false);
  const isCreating = !user;

  const form = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      password: '',
      enabled: user?.enabled ?? true,
      avatarUrl: user?.avatarUrl || '',
    },
  });

  // 当user变化时重置表单
  const resetForm = () => {
    form.reset({
      name: user?.name || '',
      email: user?.email || '',
      password: '',
      enabled: user?.enabled ?? true,
      avatarUrl: user?.avatarUrl || '',
    });
  };

  const onSubmit = async (data: UserFormData) => {
    setLoading(true);
    
    try {
      if (isCreating) {
        // 创建用户
        if (!data.password) {
          toast.error('创建用户时密码不能为空');
          setLoading(false);
          return;
        }
        
        await createUser({
          name: data.name,
          email: data.email,
          password: data.password,
          enabled: data.enabled,
        });
        
        toast.success('用户创建成功');
      } else {
        // 更新用户
        await updateUser(user!.id, {
          name: data.name,
          email: data.email,
          enabled: data.enabled,
          avatarUrl: data.avatarUrl,
        });
        
        toast.success('用户信息更新成功');
      }
      
      onOpenChange(false);
      onSuccess?.();
      form.reset();
      
    } catch (error: any) {
      console.error('操作失败:', error);
      toast.error(error.message || (isCreating ? '创建用户失败' : '更新用户失败'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!newOpen) {
        resetForm();
      }
      onOpenChange(newOpen);
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isCreating ? '创建新用户' : '编辑用户'}
          </DialogTitle>
          <DialogDescription>
            {isCreating 
              ? '填写用户信息创建新账户。密码字段为必填项。'
              : '修改用户的基本信息和状态。'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>姓名</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="请输入姓名" 
                      {...field} 
                      disabled={loading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>邮箱</FormLabel>
                  <FormControl>
                    <Input 
                      type="email"
                      placeholder="请输入邮箱地址" 
                      {...field} 
                      disabled={loading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isCreating && (
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>密码</FormLabel>
                    <FormControl>
                      <Input 
                        type="password"
                        placeholder="请输入密码" 
                        {...field} 
                        disabled={loading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="avatarUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>头像URL（可选）</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="请输入头像URL" 
                      {...field} 
                      disabled={loading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="enabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>启用状态</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      禁用的用户将无法登录系统
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={loading}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                取消
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                )}
                {isCreating ? '创建' : '保存'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}