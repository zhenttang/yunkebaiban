// 社区功能API调用函数
import type {
  CommunityDoc,
  ShareToCommunityRequest,
  GetCommunityDocsParams,
  CommunityDocsResponse,
  CommunityApiResponse
} from '../types/community';
import { CommunityPermission } from '../types/community';

// 模拟request对象，实际项目中应该从现有的api模块导入
const request = {
  post: async (url: string, data: any): Promise<any> => {
    // 模拟API调用
    console.log('POST', url, data);
    return { success: true, message: '操作成功' };
  },
  get: async (url: string): Promise<any> => {
    // 模拟API调用
    console.log('GET', url);
    return { success: true, docs: [], total: 0 };
  },
  delete: async (url: string): Promise<any> => {
    // 模拟API调用
    console.log('DELETE', url);
    return { success: true, message: '删除成功' };
  },
  put: async (url: string, data: any): Promise<any> => {
    // 模拟API调用
    console.log('PUT', url, data);
    return { success: true, message: '更新成功' };
  }
};

export const communityApi = {
  /**
   * 分享文档到社区
   */
  shareDocToCommunity: async (
    workspaceId: string, 
    docId: string, 
    data: ShareToCommunityRequest
  ): Promise<CommunityApiResponse> => {
    return request.post(`/api/community/workspaces/${workspaceId}/docs/${docId}/share`, data);
  },

  /**
   * 获取社区文档列表
   */
  getCommunityDocs: async (
    workspaceId: string, 
    params: GetCommunityDocsParams = {}
  ): Promise<CommunityDocsResponse> => {
    const searchParams = new URLSearchParams();
    if (params.page !== undefined) searchParams.set('page', params.page.toString());
    if (params.size !== undefined) searchParams.set('size', params.size.toString());
    if (params.search) searchParams.set('search', params.search);
    
    const queryString = searchParams.toString();
    const url = `/api/community/workspaces/${workspaceId}/docs${queryString ? `?${queryString}` : ''}`;
    
    return request.get(url);
  },

  /**
   * 取消文档社区分享
   */
  unshareDocFromCommunity: async (
    workspaceId: string, 
    docId: string
  ): Promise<CommunityApiResponse> => {
    return request.delete(`/api/community/workspaces/${workspaceId}/docs/${docId}/share`);
  },

  /**
   * 更新文档社区权限
   */
  updateCommunityPermission: async (
    workspaceId: string, 
    docId: string, 
    permission: CommunityPermission
  ): Promise<CommunityApiResponse> => {
    return request.put(`/api/community/workspaces/${workspaceId}/docs/${docId}/permission`, {
      permission
    });
  },

  /**
   * 增加文档浏览次数
   */
  incrementViewCount: async (
    workspaceId: string, 
    docId: string
  ): Promise<CommunityApiResponse> => {
    return request.post(`/api/community/workspaces/${workspaceId}/docs/${docId}/view`);
  }
};

// 导出权限选项供UI使用
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
];