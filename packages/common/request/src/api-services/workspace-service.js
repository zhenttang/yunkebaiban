import { httpClient } from '..';
import { API_ENDPOINTS } from '../config';
/**
 * 工作区服务类
 */
export class WorkspaceService {
    /**
     * 获取工作区列表
     */
    static async getWorkspaces() {
        return httpClient.get(API_ENDPOINTS.workspaces.list, undefined, { cache: true, cacheTime: 5000 } // 缓存5秒
        );
    }
    /**
     * 创建工作区
     * @param workspace 工作区信息
     */
    static async createWorkspace(workspace) {
        // 创建工作区可能耗时较长，设置更长的超时时间
        return httpClient.post(API_ENDPOINTS.workspaces.create, workspace, { timeout: 120000, retry: true } // 120秒超时，允许重试
        );
    }
    /**
     * 获取工作区详情
     * @param id 工作区ID
     */
    static async getWorkspace(id) {
        return httpClient.get(API_ENDPOINTS.workspaces.get, { id }, { cache: true });
    }
    /**
     * 更新工作区
     * @param id 工作区ID
     * @param workspace 工作区更新信息
     */
    static async updateWorkspace(id, workspace) {
        return httpClient.put(API_ENDPOINTS.workspaces.update, workspace, { params: { id } });
    }
    /**
     * 删除工作区
     * @param id 工作区ID
     */
    static async deleteWorkspace(id) {
        return httpClient.delete(API_ENDPOINTS.workspaces.delete, undefined, { params: { id } });
    }
    /**
     * 邀请成员
     * @param workspaceId 工作区ID
     * @param emails 邮箱列表
     * @param role 角色
     */
    static async inviteMembers(workspaceId, emails, role) {
        return httpClient.post(API_ENDPOINTS.workspaces.invite, { emails, role }, { params: { id: workspaceId } });
    }
    /**
     * 创建邀请链接
     * @param workspaceId 工作区ID
     * @param expireTime 过期时间
     */
    static async createInviteLink(workspaceId, expireTime) {
        return httpClient.post(API_ENDPOINTS.workspaces.createInviteLink, { expireTime }, { params: { id: workspaceId } });
    }
}
//# sourceMappingURL=workspace-service.js.map