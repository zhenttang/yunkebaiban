import { httpClient } from '..';
import { API_ENDPOINTS } from '../config';

/**
 * 工作区请求接口
 */
export interface WorkspaceCreateRequest {
  name: string;
  isPublic: boolean;
  enableAi: boolean;
  enableUrlPreview: boolean;
  enableDocEmbedding: boolean;
}

/**
 * 工作区信息接口
 */
export interface WorkspaceInfo {
  id: string;
  name: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  enableAi: boolean;
  enableUrlPreview: boolean;
  enableDocEmbedding: boolean;
  role?: string;
  status?: string;
  isOwner?: boolean;
  isAdmin?: boolean;
  avatarKey?: string;
}

/**
 * 工作区服务类
 */
export class WorkspaceService {
  /**
   * 获取工作区列表
   */
  static async getWorkspaces(): Promise<{ workspaces: WorkspaceInfo[] }> {
    return httpClient.get<{ workspaces: WorkspaceInfo[] }>(
      API_ENDPOINTS.workspaces.list,
      undefined,
      { cache: true, cacheTime: 5000 } // 缓存5秒
    );
  }

  /**
   * 创建工作区
   * @param workspace 工作区信息
   */
  static async createWorkspace(
    workspace: WorkspaceCreateRequest
  ): Promise<{ success: boolean; workspace: WorkspaceInfo }> {
    // 创建工作区可能耗时较长，设置更长的超时时间
    return httpClient.post<{ success: boolean; workspace: WorkspaceInfo }>(
      API_ENDPOINTS.workspaces.create,
      workspace,
      { timeout: 120000, retry: true } // 120秒超时，允许重试
    );
  }

  /**
   * 获取工作区详情
   * @param id 工作区ID
   */
  static async getWorkspace(
    id: string
  ): Promise<{ workspace: WorkspaceInfo; role: string; status: string; isOwner: boolean; isAdmin: boolean }> {
    return httpClient.get<{ workspace: WorkspaceInfo; role: string; status: string; isOwner: boolean; isAdmin: boolean }>(
      API_ENDPOINTS.workspaces.get,
      { id },
      { cache: true }
    );
  }

  /**
   * 更新工作区
   * @param id 工作区ID
   * @param workspace 工作区更新信息
   */
  static async updateWorkspace(
    id: string,
    workspace: Partial<WorkspaceCreateRequest & { avatarKey?: string }>
  ): Promise<{ success: boolean; workspace: WorkspaceInfo }> {
    return httpClient.put<{ success: boolean; workspace: WorkspaceInfo }>(
      API_ENDPOINTS.workspaces.update,
      workspace,
      { params: { id } }
    );
  }

  /**
   * 删除工作区
   * @param id 工作区ID
   */
  static async deleteWorkspace(id: string): Promise<{ success: boolean; message: string }> {
    return httpClient.delete<{ success: boolean; message: string }>(
      API_ENDPOINTS.workspaces.delete,
      undefined,
      { params: { id } }
    );
  }

  /**
   * 邀请成员
   * @param workspaceId 工作区ID
   * @param emails 邮箱列表
   * @param role 角色
   */
  static async inviteMembers(
    workspaceId: string,
    emails: string[],
    role?: string
  ): Promise<{ 
    success: boolean; 
    results: Array<{ email: string; success: boolean; message: string }>;
    successCount: number;
    totalCount: number;
  }> {
    return httpClient.post<any>(
      API_ENDPOINTS.workspaces.invite,
      { emails, role },
      { params: { id: workspaceId } }
    );
  }

  /**
   * 创建邀请链接
   * @param workspaceId 工作区ID
   * @param expireTime 过期时间
   */
  static async createInviteLink(
    workspaceId: string,
    expireTime?: string
  ): Promise<{ 
    success: boolean; 
    inviteLink: { 
      id: string; 
      link: string; 
      expiresAt: string 
    } 
  }> {
    return httpClient.post<any>(
      API_ENDPOINTS.workspaces.createInviteLink,
      { expireTime },
      { params: { id: workspaceId } }
    );
  }
} 