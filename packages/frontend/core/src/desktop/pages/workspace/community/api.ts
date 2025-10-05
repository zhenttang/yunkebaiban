/**
 * 社区功能 - API 服务层
 * 封装所有与后端 API 的交互
 */

import type {
  CommunityDocument,
  DocumentCategory,
  DocumentTag,
  DocumentComment,
  DocumentPurchase,
  DocumentStatistics,
  PublishDocumentRequest,
  UpdateDocumentRequest,
  CollectDocumentRequest,
  AddCommentRequest,
  PurchaseDocumentRequest,
  RecordViewRequest,
  CreateCategoryRequest,
  CreateTagRequest,
  GetDocumentsParams,
  SearchDocumentsParams,
  GetCommentsParams,
  GetCollectedDocumentsParams,
  PaginatedResponse,
} from './types';

const API_BASE_URL = 'http://172.24.48.1:8080/api/community';

/**
 * 通用请求函数
 */
async function request<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  // 从 localStorage 获取 JWT token
  const token = globalThis.localStorage?.getItem('affine-admin-token') ||
                globalThis.localStorage?.getItem('affine-access-token');

  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // 添加 JWT token 到 Authorization 头
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: response.statusText,
    }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

// ==================== 文档管理 API ====================

/**
 * 发布文档到社区
 */
export async function publishDocument(
  data: PublishDocumentRequest
): Promise<CommunityDocument> {
  return request<CommunityDocument>('/documents', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * 更新社区文档
 */
export async function updateDocument(
  documentId: string,
  data: UpdateDocumentRequest
): Promise<CommunityDocument> {
  return request<CommunityDocument>(`/documents/${documentId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * 删除社区文档
 */
export async function deleteDocument(documentId: string): Promise<void> {
  return request<void>(`/documents/${documentId}`, {
    method: 'DELETE',
  });
}

/**
 * 获取文档详情
 */
export async function getDocument(
  documentId: string
): Promise<CommunityDocument> {
  return request<CommunityDocument>(`/documents/${documentId}`);
}

/**
 * 获取公开文档列表
 */
export async function getPublicDocuments(
  params?: GetDocumentsParams
): Promise<PaginatedResponse<CommunityDocument>> {
  const queryParams = new URLSearchParams();

  if (params?.page !== undefined) queryParams.set('page', String(params.page));
  if (params?.size !== undefined) queryParams.set('size', String(params.size));
  if (params?.categoryId !== undefined)
    queryParams.set('categoryId', String(params.categoryId));
  if (params?.isPaid !== undefined)
    queryParams.set('isPaid', String(params.isPaid));
  if (params?.sort) queryParams.set('sort', params.sort);

  const query = queryParams.toString();
  return request<PaginatedResponse<CommunityDocument>>(
    `/documents${query ? `?${query}` : ''}`
  );
}

/**
 * 搜索文档
 */
export async function searchDocuments(
  params: SearchDocumentsParams
): Promise<PaginatedResponse<CommunityDocument>> {
  const queryParams = new URLSearchParams({
    keyword: params.keyword,
  });

  if (params.page !== undefined) queryParams.set('page', String(params.page));
  if (params.size !== undefined) queryParams.set('size', String(params.size));
  if (params.categoryId !== undefined)
    queryParams.set('categoryId', String(params.categoryId));
  if (params.isPaid !== undefined)
    queryParams.set('isPaid', String(params.isPaid));

  return request<PaginatedResponse<CommunityDocument>>(
    `/documents/search?${queryParams.toString()}`
  );
}

/**
 * 获取热门文档
 */
export async function getPopularDocuments(
  page = 0,
  size = 20
): Promise<PaginatedResponse<CommunityDocument>> {
  return request<PaginatedResponse<CommunityDocument>>(
    `/documents/popular?page=${page}&size=${size}`
  );
}

/**
 * 获取精选文档
 */
export async function getFeaturedDocuments(
  page = 0,
  size = 20
): Promise<PaginatedResponse<CommunityDocument>> {
  return request<PaginatedResponse<CommunityDocument>>(
    `/documents/featured?page=${page}&size=${size}`
  );
}

/**
 * 获取最新文档
 */
export async function getLatestDocuments(
  page = 0,
  size = 20
): Promise<PaginatedResponse<CommunityDocument>> {
  return request<PaginatedResponse<CommunityDocument>>(
    `/documents/latest?page=${page}&size=${size}`
  );
}

/**
 * 获取作者的文档列表
 */
export async function getDocumentsByAuthor(
  authorId: string,
  page = 0,
  size = 20
): Promise<PaginatedResponse<CommunityDocument>> {
  return request<PaginatedResponse<CommunityDocument>>(
    `/documents/author/${authorId}?page=${page}&size=${size}`
  );
}

// ==================== 社交功能 API ====================

/**
 * 点赞文档
 */
export async function likeDocument(
  documentId: string
): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`/documents/${documentId}/like`, {
    method: 'POST',
  });
}

/**
 * 取消点赞
 */
export async function unlikeDocument(
  documentId: string
): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`/documents/${documentId}/like`, {
    method: 'DELETE',
  });
}

/**
 * 收藏文档
 */
export async function collectDocument(
  documentId: string,
  data?: CollectDocumentRequest
): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`/documents/${documentId}/collect`, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * 取消收藏
 */
export async function uncollectDocument(
  documentId: string
): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`/documents/${documentId}/collect`, {
    method: 'DELETE',
  });
}

/**
 * 获取用户收藏的文档
 */
export async function getCollectedDocuments(
  params?: GetCollectedDocumentsParams
): Promise<PaginatedResponse<CommunityDocument>> {
  const queryParams = new URLSearchParams();

  if (params?.folderId !== undefined)
    queryParams.set('folderId', String(params.folderId));
  if (params?.page !== undefined) queryParams.set('page', String(params.page));
  if (params?.size !== undefined) queryParams.set('size', String(params.size));

  const query = queryParams.toString();
  return request<PaginatedResponse<CommunityDocument>>(
    `/documents/collected${query ? `?${query}` : ''}`
  );
}

/**
 * 关注作者
 */
export async function followAuthor(
  authorId: string
): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`/documents/authors/${authorId}/follow`, {
    method: 'POST',
  });
}

/**
 * 取消关注
 */
export async function unfollowAuthor(
  authorId: string
): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`/documents/authors/${authorId}/follow`, {
    method: 'DELETE',
  });
}

/**
 * 获取关注作者的文档
 */
export async function getFollowingDocuments(
  page = 0,
  size = 20
): Promise<PaginatedResponse<CommunityDocument>> {
  return request<PaginatedResponse<CommunityDocument>>(
    `/documents/following?page=${page}&size=${size}`
  );
}

// ==================== 评论功能 API ====================

/**
 * 添加评论
 */
export async function addComment(
  documentId: string,
  data: AddCommentRequest
): Promise<DocumentComment> {
  return request<DocumentComment>(`/documents/${documentId}/comments`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * 删除评论
 */
export async function deleteComment(commentId: number): Promise<void> {
  return request<void>(`/documents/comments/${commentId}`, {
    method: 'DELETE',
  });
}

/**
 * 获取文档评论
 */
export async function getDocumentComments(
  documentId: string,
  params?: GetCommentsParams
): Promise<PaginatedResponse<DocumentComment>> {
  const queryParams = new URLSearchParams();

  if (params?.parentId !== undefined)
    queryParams.set('parentId', String(params.parentId));
  if (params?.page !== undefined) queryParams.set('page', String(params.page));
  if (params?.size !== undefined) queryParams.set('size', String(params.size));

  const query = queryParams.toString();
  return request<PaginatedResponse<DocumentComment>>(
    `/documents/${documentId}/comments${query ? `?${query}` : ''}`
  );
}

// ==================== 付费功能 API ====================

/**
 * 购买付费文档
 */
export async function purchaseDocument(
  documentId: string,
  data: PurchaseDocumentRequest
): Promise<DocumentPurchase> {
  return request<DocumentPurchase>(`/documents/${documentId}/purchase`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ==================== 统计功能 API ====================

/**
 * 记录文档浏览
 */
export async function recordView(
  documentId: string,
  data?: RecordViewRequest
): Promise<void> {
  return request<void>(`/documents/${documentId}/view`, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * 获取文档统计信息
 */
export async function getDocumentStatistics(
  documentId: string
): Promise<DocumentStatistics> {
  return request<DocumentStatistics>(`/documents/${documentId}/statistics`);
}

// ==================== 分类标签 API ====================

/**
 * 获取所有分类
 */
export async function getAllCategories(): Promise<DocumentCategory[]> {
  return request<DocumentCategory[]>('/documents/categories');
}

/**
 * 创建分类
 */
export async function createCategory(
  data: CreateCategoryRequest
): Promise<DocumentCategory> {
  return request<DocumentCategory>('/documents/categories', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * 获取所有标签
 */
export async function getAllTags(): Promise<DocumentTag[]> {
  return request<DocumentTag[]>('/documents/tags');
}

/**
 * 创建标签
 */
export async function createTag(data: CreateTagRequest): Promise<DocumentTag> {
  return request<DocumentTag>('/documents/tags', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * 获取文档的标签
 */
export async function getDocumentTags(
  documentId: string
): Promise<DocumentTag[]> {
  return request<DocumentTag[]>(`/documents/${documentId}/tags`);
}
