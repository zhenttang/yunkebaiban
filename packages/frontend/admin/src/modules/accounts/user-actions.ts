import { httpClient } from '../../../../../common/request/src';
import type { CreateUserInput, UpdateUserInput, BatchOperationInput } from '../schema';

/**
 * 用户管理API调用函数
 */

// 创建用户
export const createUser = async (userData: CreateUserInput) => {
  const response = await httpClient.post('/api/admin/users', userData);
  return response;
};

// 更新用户
export const updateUser = async (userId: string, userData: UpdateUserInput) => {
  const response = await httpClient.put(`/api/admin/users/${userId}`, userData);
  return response;
};

// 删除用户
export const deleteUser = async (userId: string) => {
  const response = await httpClient.delete(`/api/admin/users/${userId}`);
  return response;
};

// 重置用户密码
export const resetUserPassword = async (userId: string, newPassword?: string) => {
  const response = await httpClient.post(`/api/admin/users/${userId}/reset-password`, 
    newPassword ? { password: newPassword } : {}
  );
  return response;
};

// 切换用户状态（启用/禁用）
export const toggleUserStatus = async (userId: string) => {
  const response = await httpClient.post(`/api/admin/users/${userId}/toggle-status`);
  return response;
};

// 批量操作用户
export const batchOperateUsers = async (batchData: BatchOperationInput) => {
  const response = await httpClient.post('/api/admin/users/batch', batchData);
  return response;
};

// 批量导入用户（CSV）
export const importUsersFromCsv = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await httpClient.post('/api/admin/users/batch-import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response;
};

// 获取用户统计信息
export const getUserStatistics = async () => {
  const response = await httpClient.get('/api/admin/users/statistics');
  return response;
};

// 获取单个用户详情
export const getUserById = async (userId: string) => {
  const response = await httpClient.get(`/api/admin/users/${userId}`);
  return response;
};