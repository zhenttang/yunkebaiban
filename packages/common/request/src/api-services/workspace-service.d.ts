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
export declare class WorkspaceService {
    /**
     * 获取工作区列表
     */
    static getWorkspaces(): Promise<{
        workspaces: WorkspaceInfo[];
    }>;
    /**
     * 创建工作区
     * @param workspace 工作区信息
     */
    static createWorkspace(workspace: WorkspaceCreateRequest): Promise<{
        success: boolean;
        workspace: WorkspaceInfo;
    }>;
    /**
     * 获取工作区详情
     * @param id 工作区ID
     */
    static getWorkspace(id: string): Promise<{
        workspace: WorkspaceInfo;
        role: string;
        status: string;
        isOwner: boolean;
        isAdmin: boolean;
    }>;
    /**
     * 更新工作区
     * @param id 工作区ID
     * @param workspace 工作区更新信息
     */
    static updateWorkspace(id: string, workspace: Partial<WorkspaceCreateRequest & {
        avatarKey?: string;
    }>): Promise<{
        success: boolean;
        workspace: WorkspaceInfo;
    }>;
    /**
     * 删除工作区
     * @param id 工作区ID
     */
    static deleteWorkspace(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    /**
     * 邀请成员
     * @param workspaceId 工作区ID
     * @param emails 邮箱列表
     * @param role 角色
     */
    static inviteMembers(workspaceId: string, emails: string[], role?: string): Promise<{
        success: boolean;
        results: Array<{
            email: string;
            success: boolean;
            message: string;
        }>;
        successCount: number;
        totalCount: number;
    }>;
    /**
     * 创建邀请链接
     * @param workspaceId 工作区ID
     * @param expireTime 过期时间
     */
    static createInviteLink(workspaceId: string, expireTime?: string): Promise<{
        success: boolean;
        inviteLink: {
            id: string;
            link: string;
            expiresAt: string;
        };
    }>;
}
//# sourceMappingURL=workspace-service.d.ts.map