import {
  useMutateQueryResource,
  useMutation,
} from '@yunke/admin/use-mutation';
import { useAsyncCallback } from '@yunke/core/components/hooks/yunke-async-hooks';
// import {
//   createChangePasswordUrlMutation,
//   createUserMutation,
//   deleteUserMutation,
//   disableUserMutation,
//   enableUserMutation,
//   type ImportUsersInput,
//   type ImportUsersMutation,
//   importUsersMutation,
//   listUsersQuery,
//   updateAccountFeaturesMutation,
//   updateAccountMutation,
// } from '@yunke/graphql';

// 临时占位符，用于替代 @yunke/graphql 导入
type ImportUsersInput = {
  users: {
    name: string;
    email: string;
    features?: string[];
  }[];
};

type ImportUsersMutation = {
  importUsers: {
    success: boolean;
    created: number;
    updated: number;
    errors: string[];
  };
};

const createUserMutation = {
  id: 'createUser',
  endpoint: '/api/admin/users',
  method: 'POST' as const,
};

const deleteUserMutation = {
  id: 'deleteUser',
  endpoint: '/api/admin/users/{id}',
  method: 'DELETE' as const,
};

const disableUserMutation = {
  id: 'toggleUserStatus',
  endpoint: '/api/admin/users/{id}/toggle-status',
  method: 'POST' as const,
};

const enableUserMutation = {
  id: 'toggleUserStatus',
  endpoint: '/api/admin/users/{id}/toggle-status',
  method: 'POST' as const,
};

const batchOperationMutation = {
  id: 'batchOperation',
  endpoint: '/api/admin/users/batch',
  method: 'POST' as const,
};

const importUsersMutation = {
  id: 'importUsers',
  endpoint: '/api/admin/users/batch-import',
  method: 'POST' as const,
};

const listUsersQuery = {
  id: 'listUsers',
  endpoint: '/api/admin/users',
  method: 'GET' as const,
};

const updateAccountMutation = {
  id: 'updateAccount',
  endpoint: '/api/admin/users/{id}',
  method: 'PUT' as const,
};

const updateAccountFeaturesMutation = {
  id: 'updateAccountFeatures',
  endpoint: '/api/admin/users/{userId}/features',
  method: 'PUT' as const,
};

const createChangePasswordUrlMutation = {
  id: 'resetPassword',
  endpoint: '/api/admin/users/{userId}/reset-password',
  method: 'POST' as const,
};

import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';

import type { UserInput, UserType } from '../schema';

export interface ExportField {
  id: string;
  label: string;
  checked: boolean;
}

export type UserImportReturnType = ImportUsersMutation['importUsers'];

export const useCreateUser = () => {
  const {
    trigger: createAccount,
    isMutating: creating,
    error,
  } = useMutation({
    mutation: createUserMutation,
  });

  const { trigger: updateAccountFeatures } = useMutation({
    mutation: updateAccountFeaturesMutation,
  });

  const revalidate = useMutateQueryResource();

  const create = useAsyncCallback(
    async ({ name, email, password, features }: UserInput) => {
      try {
        const response = await createAccount({
          name,
          email,
          password: password === '' ? undefined : password,
          features,
        });

        await revalidate(listUsersQuery);
        if (response?.success) {
          toast('用户创建成功');
        } else {
          toast.error('创建用户失败: ' + (response?.message || '未知错误'));
        }
      } catch (e) {
        console.error('创建用户错误:', e);
        toast.error('创建用户失败: ' + (e as Error).message);
      }
    },
    [createAccount, revalidate, updateAccountFeatures]
  );

  return { creating: creating || !!error, create };
};

export const useUpdateUser = () => {
  const {
    trigger: updateAccount,
    isMutating: updating,
    error,
  } = useMutation({
    mutation: updateAccountMutation,
  });

  const { trigger: updateAccountFeatures } = useMutation({
    mutation: updateAccountFeaturesMutation,
  });

  const revalidate = useMutateQueryResource();

  const update = useAsyncCallback(
    async ({
      userId,
      name,
      email,
      features,
    }: UserInput & { userId: string }) => {
      try {
        const response = await updateAccount({
          id: userId,
          name,
          email,
          features,
        });
        
        await revalidate(listUsersQuery);
        if (response?.success) {
          toast('用户更新成功');
        } else {
          toast.error('更新用户失败: ' + (response?.message || '未知错误'));
        }
      } catch (e) {
        console.error('更新用户错误:', e);
        toast.error('更新用户失败: ' + (e as Error).message);
      }
    },
    [revalidate, updateAccount, updateAccountFeatures]
  );

  return { updating: updating || !!error, update };
};

export const useResetUserPassword = () => {
  const [resetPasswordLink, setResetPasswordLink] = useState('');
  const { trigger: resetPassword } = useMutation({
    mutation: createChangePasswordUrlMutation,
  });

  const onResetPassword = useCallback(
    async (id: string, callback?: () => void) => {
      setResetPasswordLink('');
      resetPassword({
        userId: id,
        password: undefined, // 让后端生成随机密码
      })
        .then(res => {
          if (res?.success) {
            // 如果后端返回了新密码，设置为链接
            setResetPasswordLink(res.newPassword || '密码已重置');
            toast('密码重置成功');
            callback?.();
          } else {
            toast.error('重置密码失败: ' + (res?.message || '未知错误'));
          }
        })
        .catch(e => {
          console.error('重置密码错误:', e);
          toast.error('重置密码失败: ' + (e?.message || '网络错误'));
        });
    },
    [resetPassword]
  );

  return useMemo(() => {
    return {
      resetPasswordLink,
      onResetPassword,
    };
  }, [onResetPassword, resetPasswordLink]);
};

export const useDeleteUser = () => {
  const { trigger: deleteUserById } = useMutation({
    mutation: deleteUserMutation,
  });

  const revalidate = useMutateQueryResource();

  const deleteById = useAsyncCallback(
    async (id: string, callback?: () => void) => {
      await deleteUserById({ id })
        .then(async (response) => {
          await revalidate(listUsersQuery);
          if (response?.success) {
            toast('用户删除成功');
          } else {
            toast.error('删除用户失败: ' + (response?.message || '未知错误'));
          }
          callback?.();
        })
        .catch(e => {
          console.error('删除用户错误:', e);
          toast.error('删除用户失败: ' + (e?.message || '网络错误'));
        });
    },
    [deleteUserById, revalidate]
  );

  return deleteById;
};

export const useEnableUser = () => {
  const { trigger: toggleUserStatus } = useMutation({
    mutation: enableUserMutation,
  });

  const revalidate = useMutateQueryResource();

  const enableById = useAsyncCallback(
    async (id: string, callback?: () => void) => {
      await toggleUserStatus({ id })
        .then(async (response) => {
          await revalidate(listUsersQuery);
          if (response?.success) {
            toast(response.message || '用户状态更新成功');
          } else {
            toast.error('更新用户状态失败: ' + (response?.message || '未知错误'));
          }
          callback?.();
        })
        .catch(e => {
          console.error('切换用户状态错误:', e);
          toast.error('切换用户状态失败: ' + (e?.message || '网络错误'));
        });
    },
    [toggleUserStatus, revalidate]
  );

  return enableById;
};

export const useDisableUser = () => {
  const { trigger: toggleUserStatus } = useMutation({
    mutation: disableUserMutation,
  });

  const revalidate = useMutateQueryResource();

  const disableById = useAsyncCallback(
    async (id: string, callback?: () => void) => {
      await toggleUserStatus({ id })
        .then(async (response) => {
          await revalidate(listUsersQuery);
          if (response?.success) {
            toast(response.message || '用户状态更新成功');
          } else {
            toast.error('更新用户状态失败: ' + (response?.message || '未知错误'));
          }
          callback?.();
        })
        .catch(e => {
          console.error('切换用户状态错误:', e);
          toast.error('切换用户状态失败: ' + (e?.message || '网络错误'));
        });
    },
    [toggleUserStatus, revalidate]
  );

  return disableById;
};

export const useBatchOperation = () => {
  const { trigger: batchOperation } = useMutation({
    mutation: batchOperationMutation,
  });
  const revalidate = useMutateQueryResource();

  const executeBatchOperation = useCallback(
    async (userIds: string[], operation: 'enable' | 'disable' | 'delete', callback?: () => void) => {
      try {
        const response = await batchOperation({
          userIds,
          operation,
        });
        
        await revalidate(listUsersQuery);
        
        if (response?.success) {
          const operationText = {
            enable: '启用',
            disable: '禁用',
            delete: '删除'
          }[operation];
          toast(`成功${operationText} ${response.affected || userIds.length} 个用户`);
          callback?.();
        } else {
          toast.error(`批量操作失败: ${response?.message || '未知错误'}`);
        }
      } catch (e) {
        console.error('批量操作错误:', e);
        toast.error(`批量操作失败: ${e?.message || '网络错误'}`);
      }
    },
    [batchOperation, revalidate]
  );

  return executeBatchOperation;
};

export const useImportUsers = () => {
  const { trigger: importUsers } = useMutation({
    mutation: importUsersMutation,
  });
  const revalidate = useMutateQueryResource();

  const handleImportUsers = useCallback(
    async (
      file: File,
      callback?: (result: UserImportReturnType) => void
    ) => {
      const formData = new FormData();
      formData.append('file', file);
      
      try {
        const response = await importUsers(formData);
        await revalidate(listUsersQuery);
        
        if (response?.success) {
          const result = {
            success: true,
            created: response.created || 0,
            updated: response.updated || 0,
            errors: response.errors || [],
          };
          callback?.(result);
          toast(`成功导入 ${result.created} 个用户${result.updated > 0 ? `，更新 ${result.updated} 个用户` : ''}`);
        } else {
          toast.error('导入用户失败: ' + (response?.message || '未知错误'));
        }
      } catch (e) {
        console.error('导入用户错误:', e);
        toast.error('导入用户失败: ' + (e?.message || '网络错误'));
      }
    },
    [importUsers, revalidate]
  );

  return handleImportUsers;
};

export const useExportUsers = () => {
  const exportCSV = useCallback(
    async (users: UserType[], fields: ExportField[], callback?: () => void) => {
      const selectedFields = fields
        .filter(field => field.checked)
        .map(field => field.id);

      if (selectedFields.length === 0) {
        alert('请至少选择一个字段进行导出');
        return;
      }

      const headers = selectedFields.map(
        fieldId => fields.find(field => field.id === fieldId)?.label || fieldId
      );

      const csvRows = [headers.join(',')];

      users.forEach(user => {
        const row = selectedFields.map(fieldId => {
          const value = user[fieldId as keyof UserType];

          return typeof value === 'string'
            ? `"${value.replace(/"/g, '""')}"`
            : String(value);
        });
        csvRows.push(row.join(','));
      });

      const csvContent = csvRows.join('\n');

      // 添加BOM(字节顺序标记)以强制Excel将文件解释为UTF-8编码
      const BOM = '\uFEFF';
      const csvContentWithBOM = BOM + csvContent;

      const blob = new Blob([csvContentWithBOM], {
        type: 'text/csv;charset=utf-8;',
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', 'exported_users.csv');
      link.style.visibility = 'hidden';
      document.body.append(link);
      link.click();

      setTimeout(() => {
        link.remove();
        URL.revokeObjectURL(url);
      }, 100);

      callback?.();
    },
    []
  );

  const copyToClipboard = useCallback(
    async (users: UserType[], fields: ExportField[], callback?: () => void) => {
      const selectedFields = fields
        .filter(field => field.checked)
        .map(field => field.id);

      const dataToCopy: {
        [key: string]: string;
      }[] = [];
      users.forEach(user => {
        const row: { [key: string]: string } = {};
        selectedFields.forEach(fieldId => {
          const value = user[fieldId as keyof UserType];
          row[fieldId] = typeof value === 'string' ? value : String(value);
        });
        dataToCopy.push(row);
      });
      navigator.clipboard.writeText(JSON.stringify(dataToCopy, null, 2));
      callback?.();
    },
    []
  );

  return {
    exportCSV,
    copyToClipboard,
  };
};
