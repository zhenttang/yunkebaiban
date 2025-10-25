import { createIdentifier } from '@toeverything/infra';

export interface DocInfo {
  id: string;
  workspaceId: string;
  title?: string;
  summary?: string;
  public: boolean;
  mode: number;
  createdAt: string;
  updatedAt: string;
}

export interface DocCollaborator {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  role: 'owner' | 'editor' | 'viewer';
  lastActiveAt: string;
}

export interface CreateDocRequest {
  title?: string;
  docId?: string;
}

export interface UpdateDocRequest {
  title?: string;
  summary?: string;
  public?: boolean;
  mode?: number;
}

export interface DocSearchRequest {
  query: string;
  limit?: number;
  offset?: number;
}

export interface DocStats {
  wordCount: number;
  viewCount: number;
  collaboratorCount: number;
  lastModified: string;
}

export interface DocProvider {
  // 文档CRUD
  getDocs(workspaceId: string): Promise<DocInfo[]>;
  getDoc(workspaceId: string, docId: string): Promise<DocInfo>;
  createDoc(workspaceId: string, request: CreateDocRequest): Promise<DocInfo>;
  updateDoc(workspaceId: string, docId: string, request: UpdateDocRequest): Promise<DocInfo>;
  deleteDoc(workspaceId: string, docId: string): Promise<void>;

  // 文档搜索
  searchDocs(workspaceId: string, request: DocSearchRequest): Promise<DocInfo[]>;
  getRecentDocs(workspaceId: string, limit?: number): Promise<DocInfo[]>;

  // 协作管理
  getCollaborators(workspaceId: string, docId: string): Promise<DocCollaborator[]>;
  
  // 文档操作
  setDocTitle(workspaceId: string, docId: string, title: string): Promise<void>;
  setDocPublic(workspaceId: string, docId: string, isPublic: boolean): Promise<void>;
  
  // 文档统计
  getDocStats(workspaceId: string, docId: string): Promise<DocStats>;
}

export const DocProvider = createIdentifier<DocProvider>('DocProvider');
