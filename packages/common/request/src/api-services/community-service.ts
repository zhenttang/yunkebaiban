/**
 * 社区API服务
 * 提供文档分享到社区相关的API调用功能
 */

import { httpClient } from '../client';
import type {
  CommunityDoc,
  ShareToCommunityRequest,
  GetCommunityDocsParams,
  CommunityDocsResponse,
  CommunityPermission,
  CommunityApiResponse,
  UpdateCommunityPermissionRequest
} from '../types/community';

/**
 * 社区API调用类
 */
export class CommunityService {
  
  /**
   * 分享文档到社区
   * @param workspaceId 工作空间ID
   * @param docId 文档ID
   * @param data 分享参数
   * @returns Promise<CommunityApiResponse>
   */
  async shareDocToCommunity(
    workspaceId: string, 
    docId: string, 
    data: ShareToCommunityRequest
  ): Promise<CommunityApiResponse> {
    return httpClient.post(`/api/community/workspaces/${workspaceId}/docs/${docId}/share`, data);
  }

  /**
   * 获取社区文档列表
   * @param workspaceId 工作空间ID
   * @param params 查询参数
   * @returns Promise<CommunityDocsResponse>
   */
  async getCommunityDocs(
    workspaceId: string, 
    params: GetCommunityDocsParams = {}
  ): Promise<CommunityDocsResponse> {
    const searchParams = new URLSearchParams();
    
    if (params.page !== undefined) {
      searchParams.set('page', params.page.toString());
    }
    if (params.size !== undefined) {
      searchParams.set('size', params.size.toString());
    }
    if (params.search) {
      searchParams.set('search', params.search);
    }
    
    const queryString = searchParams.toString();
    const url = `/api/community/workspaces/${workspaceId}/docs${queryString ? `?${queryString}` : ''}`;
    
    return httpClient.get(url);
  }

  /**
   * 取消文档社区分享
   * @param workspaceId 工作空间ID
   * @param docId 文档ID
   * @returns Promise<CommunityApiResponse>
   */
  async unshareDocFromCommunity(
    workspaceId: string, 
    docId: string
  ): Promise<CommunityApiResponse> {
    return httpClient.delete(`/api/community/workspaces/${workspaceId}/docs/${docId}/share`);
  }

  /**
   * 更新文档社区权限
   * @param workspaceId 工作空间ID
   * @param docId 文档ID
   * @param permission 新的权限级别
   * @returns Promise<CommunityApiResponse>
   */
  async updateCommunityPermission(
    workspaceId: string, 
    docId: string, 
    permission: CommunityPermission
  ): Promise<CommunityApiResponse> {
    return httpClient.put(`/api/community/workspaces/${workspaceId}/docs/${docId}/permission`, {
      permission
    });
  }

  /**
   * 增加文档浏览次数
   * @param workspaceId 工作空间ID
   * @param docId 文档ID
   * @returns Promise<CommunityApiResponse>
   */
  async incrementViewCount(
    workspaceId: string, 
    docId: string
  ): Promise<CommunityApiResponse> {
    return httpClient.post(`/api/community/workspaces/${workspaceId}/docs/${docId}/view`);
  }

  /**
   * 获取文档的社区分享状态
   * @param workspaceId 工作空间ID
   * @param docId 文档ID
   * @returns Promise<CommunityApiResponse<CommunityDoc>>
   */
  async getCommunityDocStatus(
    workspaceId: string, 
    docId: string
  ): Promise<CommunityApiResponse<CommunityDoc>> {
    return httpClient.get(`/api/community/workspaces/${workspaceId}/docs/${docId}`);
  }
}

/**
 * 社区API服务单例实例
 */
export const communityService = new CommunityService();

/**
 * 社区API函数式调用接口（便于使用）
 */
export const communityApi = {
  /**
   * 分享文档到社区
   */
  shareDocToCommunity: (
    workspaceId: string, 
    docId: string, 
    data: ShareToCommunityRequest
  ) => communityService.shareDocToCommunity(workspaceId, docId, data),

  /**
   * 获取社区文档列表
   */
  getCommunityDocs: (
    workspaceId: string, 
    params?: GetCommunityDocsParams
  ) => communityService.getCommunityDocs(workspaceId, params),

  /**
   * 取消文档社区分享
   */
  unshareDocFromCommunity: (
    workspaceId: string, 
    docId: string
  ) => communityService.unshareDocFromCommunity(workspaceId, docId),

  /**
   * 更新文档社区权限
   */
  updateCommunityPermission: (
    workspaceId: string, 
    docId: string, 
    permission: CommunityPermission
  ) => communityService.updateCommunityPermission(workspaceId, docId, permission),

  /**
   * 增加文档浏览次数
   */
  incrementViewCount: (
    workspaceId: string, 
    docId: string
  ) => communityService.incrementViewCount(workspaceId, docId),

  /**
   * 获取文档社区分享状态
   */
  getCommunityDocStatus: (
    workspaceId: string, 
    docId: string
  ) => communityService.getCommunityDocStatus(workspaceId, docId)
};

/**
 * 权限选项配置（供UI组件使用）
 */
export const COMMUNITY_PERMISSION_OPTIONS = [
  {
    value: CommunityPermission.PUBLIC,
    label: '公开',
    description: '所有工作空间成员可见'
  },
  {
    value: CommunityPermission.COLLABORATOR,
    label: '协作者',
    description: '协作者及以上权限可见'
  },
  {
    value: CommunityPermission.ADMIN,
    label: '管理员',
    description: '仅管理员和所有者可见'
  },
  {
    value: CommunityPermission.CUSTOM,
    label: '自定义',
    description: '指定用户可见'
  }
] as const;

/**
 * 权限级别优先级映射（用于权限比较）
 */
export const PERMISSION_PRIORITY = {
  [CommunityPermission.PUBLIC]: 1,
  [CommunityPermission.COLLABORATOR]: 2,
  [CommunityPermission.ADMIN]: 3,
  [CommunityPermission.CUSTOM]: 4
} as const;

/**
 * 工具函数：检查权限是否足够
 * @param userPermission 用户权限
 * @param requiredPermission 所需权限
 * @returns boolean
 */
export const hasPermission = (
  userPermission: CommunityPermission, 
  requiredPermission: CommunityPermission
): boolean => {
  return PERMISSION_PRIORITY[userPermission] >= PERMISSION_PRIORITY[requiredPermission];
};

/**
 * 工具函数：获取权限显示文本
 * @param permission 权限级别
 * @returns string
 */
export const getPermissionLabel = (permission: CommunityPermission): string => {
  const option = COMMUNITY_PERMISSION_OPTIONS.find(opt => opt.value === permission);
  return option?.label || '未知';
};

/**
 * 工具函数：获取权限描述文本
 * @param permission 权限级别
 * @returns string
 */
export const getPermissionDescription = (permission: CommunityPermission): string => {
  const option = COMMUNITY_PERMISSION_OPTIONS.find(opt => opt.value === permission);
  return option?.description || '';
};