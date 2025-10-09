/**
 * 社区API服务
 * 提供文档分享到社区相关的API调用功能
 */
import type { CommunityDoc, ShareToCommunityRequest, GetCommunityDocsParams, CommunityDocsResponse, CommunityApiResponse } from '../types/community';
import { CommunityPermission } from '../types/community';
/**
 * 社区API调用类
 */
export declare class CommunityService {
    private readonly http;
    /**
     * 分享文档到社区
     * @param workspaceId 工作空间ID
     * @param docId 文档ID
     * @param data 分享参数
     * @returns Promise<CommunityApiResponse>
     */
    shareDocToCommunity(workspaceId: string, docId: string, data: ShareToCommunityRequest): Promise<CommunityApiResponse>;
    /**
     * 获取社区文档列表
     * @param workspaceId 工作空间ID
     * @param params 查询参数
     * @returns Promise<CommunityDocsResponse>
     */
    getCommunityDocs(workspaceId: string, params?: GetCommunityDocsParams): Promise<CommunityDocsResponse>;
    /**
     * 取消文档社区分享
     * @param workspaceId 工作空间ID
     * @param docId 文档ID
     * @returns Promise<CommunityApiResponse>
     */
    unshareDocFromCommunity(workspaceId: string, docId: string): Promise<CommunityApiResponse>;
    /**
     * 更新文档社区权限
     * @param workspaceId 工作空间ID
     * @param docId 文档ID
     * @param permission 新的权限级别
     * @returns Promise<CommunityApiResponse>
     */
    updateCommunityPermission(workspaceId: string, docId: string, permission: CommunityPermission): Promise<CommunityApiResponse>;
    /**
     * 增加文档浏览次数
     * @param workspaceId 工作空间ID
     * @param docId 文档ID
     * @returns Promise<CommunityApiResponse>
     */
    incrementViewCount(workspaceId: string, docId: string): Promise<CommunityApiResponse>;
    /**
     * 获取文档的社区分享状态
     * @param workspaceId 工作空间ID
     * @param docId 文档ID
     * @returns Promise<CommunityApiResponse<CommunityDoc>>
     */
    getCommunityDocStatus(workspaceId: string, docId: string): Promise<CommunityApiResponse<CommunityDoc>>;
}
/**
 * 社区API服务单例实例
 */
export declare const communityService: CommunityService;
/**
 * 社区API函数式调用接口（便于使用）
 */
export declare const communityApi: {
    /**
     * 分享文档到社区
     */
    shareDocToCommunity: (workspaceId: string, docId: string, data: ShareToCommunityRequest) => Promise<CommunityApiResponse<any>>;
    /**
     * 获取社区文档列表
     */
    getCommunityDocs: (workspaceId: string, params?: GetCommunityDocsParams) => Promise<CommunityDocsResponse>;
    /**
     * 取消文档社区分享
     */
    unshareDocFromCommunity: (workspaceId: string, docId: string) => Promise<CommunityApiResponse<any>>;
    /**
     * 更新文档社区权限
     */
    updateCommunityPermission: (workspaceId: string, docId: string, permission: CommunityPermission) => Promise<CommunityApiResponse<any>>;
    /**
     * 增加文档浏览次数
     */
    incrementViewCount: (workspaceId: string, docId: string) => Promise<CommunityApiResponse<any>>;
    /**
     * 获取文档社区分享状态
     */
    getCommunityDocStatus: (workspaceId: string, docId: string) => Promise<CommunityApiResponse<CommunityDoc>>;
};
/**
 * 权限选项配置（供UI组件使用）
 */
export declare const COMMUNITY_PERMISSION_OPTIONS: readonly [{
    readonly value: CommunityPermission.PUBLIC;
    readonly label: "公开";
    readonly description: "所有工作空间成员可见";
}, {
    readonly value: CommunityPermission.COLLABORATOR;
    readonly label: "协作者";
    readonly description: "协作者及以上权限可见";
}, {
    readonly value: CommunityPermission.ADMIN;
    readonly label: "管理员";
    readonly description: "仅管理员和所有者可见";
}, {
    readonly value: CommunityPermission.CUSTOM;
    readonly label: "自定义";
    readonly description: "指定用户可见";
}];
/**
 * 权限级别优先级映射（用于权限比较）
 */
export declare const PERMISSION_PRIORITY: {
    readonly PUBLIC: 1;
    readonly COLLABORATOR: 2;
    readonly ADMIN: 3;
    readonly CUSTOM: 4;
};
/**
 * 工具函数：检查权限是否足够
 * @param userPermission 用户权限
 * @param requiredPermission 所需权限
 * @returns boolean
 */
export declare const hasPermission: (userPermission: CommunityPermission, requiredPermission: CommunityPermission) => boolean;
/**
 * 工具函数：获取权限显示文本
 * @param permission 权限级别
 * @returns string
 */
export declare const getPermissionLabel: (permission: CommunityPermission) => string;
/**
 * 工具函数：获取权限描述文本
 * @param permission 权限级别
 * @returns string
 */
export declare const getPermissionDescription: (permission: CommunityPermission) => string;
//# sourceMappingURL=community-service.d.ts.map