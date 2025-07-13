import { createIdentifier } from '@toeverything/infra';

export interface WorkspaceInfo {
  id: string;
  name: string;
  public: boolean;
  createdAt: string;
  enableAi: boolean;
  enableUrlPreview: boolean;
  enableDocEmbedding: boolean;
  avatarKey?: string;
  indexed: boolean;
}

export interface WorkspaceMember {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: string;
}

export interface CreateWorkspaceRequest {
  name: string;
  public?: boolean;
  enableAi?: boolean;
  enableUrlPreview?: boolean;
  enableDocEmbedding?: boolean;
}

export interface UpdateWorkspaceRequest {
  name?: string;
  public?: boolean;
  enableAi?: boolean;
  enableUrlPreview?: boolean;
  enableDocEmbedding?: boolean;
  avatarKey?: string;
}

export interface InviteRequest {
  email: string;
  role?: 'admin' | 'member';
}

export interface WorkspaceProvider {
  // 工作空间CRUD
  getWorkspaces(): Promise<WorkspaceInfo[]>;
  getWorkspace(workspaceId: string): Promise<WorkspaceInfo>;
  createWorkspace(request: CreateWorkspaceRequest): Promise<WorkspaceInfo>;
  updateWorkspace(workspaceId: string, request: UpdateWorkspaceRequest): Promise<WorkspaceInfo>;
  deleteWorkspace(workspaceId: string): Promise<void>;

  // 成员管理
  getMembers(workspaceId: string): Promise<WorkspaceMember[]>;
  inviteMember(workspaceId: string, request: InviteRequest): Promise<void>;
  removeMember(workspaceId: string, memberId: string): Promise<void>;
  updateMemberRole(workspaceId: string, memberId: string, role: 'admin' | 'member'): Promise<void>;

  // 邀请链接
  createInviteLink(workspaceId: string): Promise<{ link: string; expires: string }>;
  revokeInviteLink(workspaceId: string): Promise<void>;
  getPendingInvitations(workspaceId: string): Promise<any[]>;
}

export const WorkspaceProvider = createIdentifier<WorkspaceProvider>('WorkspaceProvider');