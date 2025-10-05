// 社区功能API调用函数
import type {
  ShareToCommunityRequest,
  GetCommunityDocsParams,
  CommunityDocsResponse,
} from '../types/community';
import type { CommunityDocument } from '../desktop/pages/workspace/community/types';
import { CommunityPermission } from '../types/community';

const API_BASE_URL = 'http://172.24.48.1:8080';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  // 从 localStorage 获取 JWT token
  const token = globalThis.localStorage?.getItem('affine-admin-token') ||
                globalThis.localStorage?.getItem('affine-access-token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options?.headers as Record<string, string>) || {}),
  };

  // 添加 JWT token 到 Authorization 头
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: response.statusText,
    }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

export const communityApi = {
  /**
   * 分享文档到社区
   */
  shareDocToCommunity: async (
    workspaceId: string,
    docId: string,
    data: ShareToCommunityRequest
  ): Promise<CommunityDocument> => {
    return request<CommunityDocument>(`/api/community/documents`, {
      method: 'POST',
      body: JSON.stringify({
        workspaceId,
        sourceDocId: docId,
        title: data.title,
        description: data.description,
        contentSnapshot: null,
        coverImage: null,
        categoryId: null,
        tagIds: [],
        isPaid: false,
        price: null
      }),
    });
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
    const url = `/api/community/documents${queryString ? `?${queryString}` : ''}`;

    return request<CommunityDocsResponse>(url);
  },

  /**
   * 取消文档社区分享
   */
  unshareDocFromCommunity: async (
    workspaceId: string,
    docId: string
  ): Promise<void> => {
    const token = globalThis.localStorage?.getItem('affine-admin-token') ||
                  globalThis.localStorage?.getItem('affine-access-token');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    await fetch(`${API_BASE_URL}/api/community/documents/${docId}`, {
      method: 'DELETE',
      headers,
    });
  },

  /**
   * 更新文档社区权限
   */
  updateCommunityPermission: async (
    workspaceId: string,
    docId: string,
    permission: CommunityPermission
  ): Promise<CommunityDocument> => {
    return request<CommunityDocument>(`/api/community/documents/${docId}`, {
      method: 'PUT',
      body: JSON.stringify({
        title: null,
        description: null,
        categoryId: null,
        tagIds: [],
        isPaid: null,
        price: null
      }),
    });
  },

  /**
   * 增加文档浏览次数
   */
  incrementViewCount: async (
    workspaceId: string,
    docId: string
  ): Promise<void> => {
    const token = globalThis.localStorage?.getItem('affine-admin-token') ||
                  globalThis.localStorage?.getItem('affine-access-token');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    await fetch(`${API_BASE_URL}/api/community/documents/${docId}/view`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        userAgent: navigator.userAgent,
      }),
    });
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